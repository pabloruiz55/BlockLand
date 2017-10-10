import { Component, HostListener, NgZone } from '@angular/core';
const Web3 = require('web3');
const contract = require('truffle-contract');
const blocklandArtifacts = require('../../build/contracts/BlockLand.json');
import { canBeNumber } from '../util/validation';

declare var window: any;
declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls:['./app.component.css']
})
export class AppComponent {
  //MetaCoin = contract(metaincoinArtifacts);
  BlockLand = contract(blocklandArtifacts);

  // TODO add proper types these variables
  account: any;
  accounts: any;
  web3: any;

  availableFunds:number =0;
  contractOwner:string;

  storage: number = 0;
  amountToStore: number;
  //balance: number;
  //sendingAmount: number;
  //recipientAddress: string;
  status: string;
  canBeNumber = canBeNumber;
  canSignETHTransactions:boolean = false;

  landSpace:any[][];
  gridSize:number = 8;

  selectedLandSpace:any;

  AppStateEnum = {
    START: 0,
    BLOCK_SELECTED: 1,
    SELECTED_FOR_PURCHASE: 2,
  };

  currentAppState:any;
  processingTransaction:boolean = false;


  constructor(private _ngZone: NgZone) {

  }

  @HostListener('window:load')
  windowLoaded() {
    this.currentAppState = this.AppStateEnum.START;
    this.checkAndInstantiateWeb3();
    this.onReady();
  }

  checkAndInstantiateWeb3 = () => {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof window.web3 !== 'undefined') {
      console.warn(
        'Using web3 detected from external source. If you find that your accounts don\'t appear or you have 0 MetaCoin, ensure you\'ve configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask'
      );
      // Use Mist/MetaMask's provider
      this.web3 = new Web3(window.web3.currentProvider);
      this.canSignETHTransactions = true;
    } else {
      console.warn(
        'No web3 detected, falling back to Infura Ropsten'
        //'No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it\'s inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask'
      );
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      this.web3 = new Web3(
        //new Web3.providers.HttpProvider('http://localhost:8545')
        new Web3.providers.HttpProvider('https://ropsten.infura.io/kUB300IO3nUP3tXCxG6P')

      );
    }
  };

  onReady = () => {
    // Bootstrap the MetaCoin abstraction for Use.
    this.BlockLand.setProvider(this.web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    this.web3.eth.getAccounts((err, accs) => {
      if (err != null) {
        alert('There was an error fetching your accounts.');
        return;
      }

      if (accs.length === 0) {
        alert(
          'You are not connected to an Ethereum client. You can still browse the data, but you will not be able to perform transactions.'
        );
        return;
      }
      this.accounts = accs;
      console.log("cuentas: ",this.accounts);
      this.account = this.accounts[0];

    });
    // This is run from window:load and ZoneJS is not aware of it we
    // need to use _ngZone.run() so that the UI updates on promise resolution
    this._ngZone.run(() =>{
      this.getLandSpace();
      this.getAvailableFunds();
      this.getContractOwner();
    });
  };


    setStatus = message => {
      this.status = message;
    };

  getLandSpace(){
    this.selectedLandSpace = null;
    this.landSpace = [[],[],[],[],[],[],[],[]];
    for (let i =0;i<this.gridSize;i++){
      for (let j =0;j<this.gridSize;j++){
        this.landSpace[i].push({});
        this.getLandSpaceData(i,j);
      }
    }
  }

  getLandSpaceData(x:number,y:number, andSelectIt:boolean = false){
    let ss;
    this.BlockLand
    .deployed()
    .then(instance =>{
      ss = instance;
      return ss.getLandSpaceData.call(x,y,{
        from: this.account
      });
    })
    .then(value => {
      //console.log(value);
      let _price = value[1]!=0 ? (value[1] / Math.pow(10, 18)): 1;
      let _x = value[5]==0 ? x: value[5];
      let _y = value[6]==0 ? y: value[6];
      let land = {
        x:x,
        y:y,
        owner:value[0],
        message:value[4],
        color:value[3],
        price:_price
      }
      //console.log(land);
      //console.log(this.landSpace);
      this.landSpace[x][y]=land;
      if(andSelectIt)
        this.selectedLandSpace = land;


      //this.storage = value.toNumber();
    })
    .catch(e => {
      console.log(e);
      this.setStatus('Error getting balance; see log.');
    });
  }

  selectForBuying(){
    if(!this.selectedLandSpace && this.currentAppState != this.AppStateEnum.BLOCK_SELECTED) return;
    this.currentAppState = this.AppStateEnum.SELECTED_FOR_PURCHASE;
  }

  onBlockSubmit(){
    this.buyLand(this.selectedLandSpace.x,this.selectedLandSpace.y,this.selectedLandSpace.color,this.selectedLandSpace.message);
  }

  buyLand(x:number, y:number, color:string, message:string){
    if(!this.canSignETHTransactions)return;
    this.processingTransaction = true;
    let ss;

    this.setStatus('Initiating transaction... (please wait)');

    this.BlockLand
      .deployed()
      .then(instance => {
        ss = instance;
        if(this.selectedLandSpace.owner == "0x0000000000000000000000000000000000000000")
          return ss.buyNewLandSpace(x, y, 1, color, message, {
            from: this.account,
            value: ((this.selectedLandSpace.price * Math.pow(10, 18)))
          });
        else if(this.selectedLandSpace.owner == this.account)
          return ss.updateLandSpace(x, y, 1, color, message, {
            from: this.account
          });
        else
          return ss.expropiateLandSpace(x, y, 1, color, message, {
            from: this.account,
            value: ((this.selectedLandSpace.price * Math.pow(10, 18)))
          });
      })
      .then(result => {
        this.setStatus('Transaction complete!');
        console.log(result);
        this.getBalanceFrom(this.BlockLand.address);
        this.getBalanceFrom(this.account);
        return this.delay(3000);
      })
      .then(result=>{
        console.log("do refresh");
        this.getLandSpaceData(x,y,true);
        this.currentAppState = this.AppStateEnum.START;
        this.processingTransaction = false;
        //this.getLandSpace();
      })
      .catch(e => {
        console.log(e);
        this.setStatus('Error sending coin; see log.');
        this.processingTransaction = false;
      });
  }

  withdrawFunds(){
    if(!this.canSignETHTransactions)return;
    let ss;
    this.processingTransaction = true;

    this.setStatus('Initiating transaction... (please wait)');

    this.BlockLand
      .deployed()
      .then(instance => {
        ss = instance;
        return ss.withdraw({
          from: this.account,
          gas:4000000
        });
      })
      .then(result => {
        this.setStatus('Transaction complete!');
        console.log(result);
        return this.delay(3000);
      })
      .then(result=>{
        console.log("do refresh");
        this.getAvailableFunds();
        this.processingTransaction = false;
        //this.getLandSpace();
      })
      .catch(e => {
        console.log(e);
        this.setStatus('Error sending coin; see log.');
        this.processingTransaction = false;
      });
  }

  moveContractEtherToOwner(){
    if(!this.canSignETHTransactions)return;
    let ss;
    this.processingTransaction = true;

    this.setStatus('Initiating transaction... (please wait)');

    this.BlockLand
      .deployed()
      .then(instance => {
        ss = instance;
        return ss.moveContractEtherToOwner({
          from: this.account,
          gas:4000000
        });
      })
      .then(result => {
        this.setStatus('Transaction complete!');
        console.log(result);
        return this.delay(3000);
      })
      .then(result=>{
        console.log("do refresh");
        this.processingTransaction = false;
        this.getAvailableFunds();
        //this.getLandSpace();
      })
      .catch(e => {
        console.log(e);
        this.setStatus('Error sending coin; see log.');
        this.processingTransaction = false;
      });
  }

  getAvailableFunds(){
    let ss;
    this.BlockLand
    .deployed()
    .then(instance =>{
      ss = instance;
      return ss.getAvailableFunds.call({
        from: this.account
      });
    })
    .then(value => {
      this.availableFunds =value.toNumber() / Math.pow(10, 18);
    })
    .catch(e => {
      console.log(e);
      this.setStatus('Error getting balance; see log.');
    });
  }

  getContractOwner(){
    let ss;
    this.BlockLand
    .deployed()
    .then(instance =>{
      ss = instance;
      return ss.getContractOwner.call({
        from: this.account
      });
    })
    .then(value => {
      console.log(value);
      this.contractOwner =value;
      console.log("contract owner:",this.contractOwner);
    })
    .catch(e => {
      console.log("ERR",e);
      this.setStatus('Error');
    });
  }

  selectLandSpace(x:number, y:number){
    this.selectedLandSpace = this.landSpace[x][y];
    this.currentAppState = this.AppStateEnum.BLOCK_SELECTED;
    console.log(this.selectedLandSpace);
  }


  delay(t:number) {
     return new Promise(function(resolve) {
         setTimeout(resolve, t)
     });
  }

  getBalanceFrom(address:string){
    return this.web3.eth.getBalance(address, function (error, result) {
      if (!error) {
        console.log(address,result.toNumber());
      } else {
        console.error(error);
      }
    })
  }


}
