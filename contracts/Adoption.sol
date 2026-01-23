pragma solidity ^0.5.0;

contract Adoption {
  address public owner;

  // record total donations
  uint public totalDonations;

  constructor() public {
      owner = msg.sender;   // deployer becomes owner
  }

  address[16] public adopters;

// update struct
  struct RegisteredPet {
    string name;
    string breed;     
    uint age;         
    string location;  
    string pictureUrl; 
    address owner;
    bool isAdopted;
  }

  RegisteredPet[] public registeredPets;

  // Anyone can donate ETH to the petshop
  function donate() public payable {
      require(msg.value > 0, "Must send ETH to donate.");
      totalDonations += msg.value;
  }

  // Owner can withdraw all donations
  function withdraw() public {
      require(msg.sender == owner, "Only owner can withdraw.");
      address payable recipient = address(uint160(owner));
      recipient.transfer(address(this).balance);
  }

  // ============ LIKE SYSTEM ============

  // petId => total likes
  mapping(uint => uint) public petLikes;

  // user => (petId => liked?)
  mapping(address => mapping(uint => bool)) public userLiked;

  // Adopting a pet
  function adopt(uint petId) public returns (uint) {
    require(petId >= 0 && petId <= 15);
    adopters[petId] = msg.sender;
    return petId;
  }

  // update arguments
  function registerPet(
    string memory _name,
    string memory _breed,
    uint _age,
    string memory _location,
    string memory _pictureUrl
  ) public payable returns (uint) {
    require(msg.value >= 10000000000000000, "Registration fee of 0.01 ETH is required.");

    // create new pets to register
    registeredPets.push(
      RegisteredPet({
        name: _name,
        breed: _breed,
        age: _age,
        location: _location,
        pictureUrl: _pictureUrl,
        owner: msg.sender,
        isAdopted: false
      })
    );

    return registeredPets.length - 1;
  }

  function adoptRegisteredPet(uint petIndex) public returns (uint) {

    require(petIndex < registeredPets.length, "Invalid registered pet index.");
    
    require(registeredPets[petIndex].isAdopted == false, "Pet is already adopted.");

    registeredPets[petIndex].isAdopted = true;
    
    return petIndex;
  }

  //get number of registered pets
  function getRegisteredPetsCount() public view returns (uint) {
    return registeredPets.length;
  }

  // Retrieving the adopters
  function getAdopters() public view returns (address[16] memory) {
    return adopters;
  }

  function toggleLike(uint petId) public {
    uint totalPets = 16 + registeredPets.length; 

    require(petId < totalPets, "Invalid petId");

    // If already liked → unlike
    if (userLiked[msg.sender][petId]) {
        userLiked[msg.sender][petId] = false;
        petLikes[petId] -= 1;
    }
    // If not liked → like
    else {
        userLiked[msg.sender][petId] = true;
        petLikes[petId] += 1;
    }
  }

  function getMyLikedPets() public view returns (uint[] memory) {
    uint totalPets = 16 + registeredPets.length;   // FIX

    uint count = 0;

    // Count how many pets I have liked
    for (uint i = 0; i < totalPets; i++) {
        if (userLiked[msg.sender][i]) {
            count++;
        }
    }

    // Create array
    uint[] memory liked = new uint[](count);
    uint index = 0;

    for (uint i = 0; i < totalPets; i++) {
        if (userLiked[msg.sender][i]) {
            liked[index] = i;
            index++;
        }
    }

    return liked;
  }

}


