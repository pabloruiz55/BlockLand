pragma solidity ^0.4.0;

contract SimpleStorage {
    uint public storedData;

    event Store(uint _prev,uint _storedData);

    function SimpleStorage() {
  		storedData = 999;
  	}

    function() payable { }

    function set(uint x) public {
        uint prev = storedData;
        storedData = x;
        Store(prev, storedData);
    }

    function get() public constant returns (uint) {
        return storedData;
    }

    function payEther(address _to) public payable returns (bool){
      _to.transfer(msg.value);
      return true;
    }

        /////////////////////
            /////////////////////
                /////////////////////
                    /////////////////////
                        /////////////////////
                            /////////////////////

}
