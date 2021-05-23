pragma solidity ^0.4.0;

contract BlockLand {

    struct Land {
        address owner;
        uint256 price;
        uint8 status;
        string color;
        string message;
        uint8 x;
        uint8 y;
    }

    Land[8][8]landSpace;
    address owner;
    mapping (address => uint) pendingWithdrawals;

    event BuyLand(
        address _from,
        address _buyer,
        uint _price
    );

    ///asasassdsdsdsdssssssasas

    function BlockLand() payable {
      owner = msg.sender;
  	}

    function() payable { }

    function expropiateLandSpace(uint8 x, uint8 y, uint8 status, string color, string message) payable returns (bool){

      require (msg.value == landSpace[x][y].price && msg.sender != landSpace[x][y].owner && landSpace[x][y].owner != address(0));

      Land storage ownedLand = landSpace[x][y];
      ownedLand.message = message;
      ownedLand.color = color;
      ownedLand.status = status;

      uint commission = (msg.value * 5) /100; //5% commission for the contract
      uint moneyForOwner = (msg.value * 95)/100; // Transfer 95% of the money to the owner
      address prevOwner = landSpace[x][y].owner;
      pendingWithdrawals[this] += commission;
      pendingWithdrawals[prevOwner] += moneyForOwner;

      ownedLand.price = landSpace[x][y].price + 1000000000000000000;
      landSpace[x][y].owner = msg.sender;

      BuyLand(prevOwner,msg.sender,msg.value);

      return true;
    }

    function buyNewLandSpace(uint8 x, uint8 y, uint8 status, string color, string message) payable returns (bool){

      require (landSpace[x][y].owner == address(0) && msg.value == 1000000000000000000);

      landSpace[x][y] = Land(msg.sender,2000000000000000000,status,color,message,x,y);
      pendingWithdrawals[this] += msg.value;

      BuyLand(address(0),msg.sender,msg.value);

      return true;
    }

    function updateLandSpace(uint8 x, uint8 y, uint8 status, string color, string message) returns (bool){

      require (msg.sender == landSpace[x][y].owner);

      Land storage ownedLand = landSpace[x][y];
      ownedLand.message = message;
      ownedLand.color = color;
      ownedLand.status = status;

      return true;
    }

    function getLandSpaceData(uint8 x, uint8 y) constant returns (address _owner, uint256 _price, uint8 _status, string _color, string _message,uint8 _x, uint8 _y){
      Land storage l = landSpace[x][y];
      _x =l.x;
      _y = l.y;
      _owner = l.owner;
      _price = l.price;
      _status = l.status;
      _color = l.color;
      _message = l.message;
    }

    function getAvailableFunds() constant returns(uint) {
      return pendingWithdrawals[msg.sender];
    }

    function getContractOwner() constant returns(address) {
      require(msg.sender == owner);
      return owner;
    }

    function withdraw() {
        uint amount = pendingWithdrawals[msg.sender];
        // Remember to zero the pending refund before
        // sending to prevent re-entrancy attacks
        pendingWithdrawals[msg.sender] = 0;
        msg.sender.transfer(amount);
    }

    function moveContractEtherToOwner(){
      require(msg.sender == owner);

      uint amount = pendingWithdrawals[this];
      // Remember to zero the pending refund before
      // sending to prevent re-entrancy attacks
      pendingWithdrawals[this] = 0;
      pendingWithdrawals[msg.sender] += amount;
    }



}
