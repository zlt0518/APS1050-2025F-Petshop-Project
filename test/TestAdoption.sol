pragma solidity ^0.5.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Adoption.sol";

contract TestAdoption {

    Adoption adoption;

    // test accounts provided by Truffle
    address public tester = address(this);

    uint public defaultPetId = 5;
    string public testName = "Milo";
    string public testBreed = "Husky";
    uint public testAge = 3;
    string public testLocation = "Toronto";
    string public testPic = "https://abc.com/img";

    // ------- Setup before each test -------
    function beforeAll() public {
        adoption = Adoption(DeployedAddresses.Adoption());
    }

    // =====================================================
    // 1. Test original adopt() function
    // =====================================================
    function testUserCanAdoptOriginalPet() public {
        uint returnedId = adoption.adopt(defaultPetId);
        Assert.equal(returnedId, defaultPetId, "Pet ID should match for adopt()");
    }

    function testOriginalPetOwner() public {
        address adopter = adoption.adopters(defaultPetId);
        Assert.equal(adopter, tester, "Original pet adopter should be this test contract");
    }

    // =====================================================
    // 2. Test registerPet()
    // =====================================================
    function testRegisterPet() public {
        uint regFee = 10000000000000000; // 0.01 ETH
        uint newId = adoption.registerPet.value(regFee)(
            testName,
            testBreed,
            testAge,
            testLocation,
            testPic
        );

        Assert.equal(newId, 0, "First registered pet index should be 0");
    }

    function testRegisteredPetData() public {
        (string memory name,
         string memory breed,
         uint age,
         string memory location,
         string memory pic,
         address owner,
         bool adopted) = adoption.registeredPets(0);

        Assert.equal(name, testName, "Registered pet name must match.");
        Assert.equal(breed, testBreed, "Registered pet breed must match.");
        Assert.equal(age, testAge, "Registered pet age must match.");
        Assert.equal(location, testLocation, "Registered pet location must match.");
        Assert.equal(pic, testPic, "Registered pet picture URL must match.");
        Assert.equal(owner, tester, "Registered pet owner must be this contract.");
        Assert.equal(adopted, false, "Registered pet should start unadopted.");
    }

    // =====================================================
    // 3. adoptRegisteredPet()
    // =====================================================
    function testAdoptRegisteredPet() public {
        uint returnedId = adoption.adoptRegisteredPet(0);
        Assert.equal(returnedId, 0, "Registered pet adoption ID must match.");
    }

    function testRegisteredPetOwnerAfterAdopt() public {
        (, , , , , , bool adopted) = adoption.registeredPets(0);
        Assert.equal(adopted, true, "Registered pet must be marked adopted.");
    }

    // =====================================================
    // 4. Like / Unlike System
    // =====================================================
    function testLikePet() public {
        adoption.toggleLike(defaultPetId);
        uint likes = adoption.petLikes(defaultPetId);
        Assert.equal(likes, 1, "Like count should become 1 after liking.");
    }

    function testUnlikePet() public {
        adoption.toggleLike(defaultPetId);
        uint likes = adoption.petLikes(defaultPetId);
        Assert.equal(likes, 0, "Like count should return to 0 after unliking.");
    }

    // getMyLikedPets()
    function testGetMyLikedPets() public {
        adoption.toggleLike(defaultPetId); // Like again
        uint[] memory liked = adoption.getMyLikedPets();
        Assert.equal(liked.length, 1, "User should have 1 liked pet.");
        Assert.equal(liked[0], defaultPetId, "Liked pet ID must match.");
    }

    // =====================================================
    // 5. Donation & Withdraw
    // =====================================================
    function testDonation() public {
        uint before = address(adoption).balance;
        uint donateAmount = 5000000000000000; // 0.005 ETH

        adoption.donate.value(donateAmount)();

        uint afterBal = address(adoption).balance;
        Assert.equal(
            afterBal,
            before + donateAmount,
            "Contract balance should increase after donation."
        );
    }

    function testOnlyOwnerCanWithdraw() public {
        bool success = true;

        // try to withdraw *NOT AS OWNER* → should fail
        // simulate as another contract: create a helper
        (success,) = address(this).call(
            abi.encodeWithSignature("tryWithdrawAsNonOwner()")
        );

        Assert.equal(success, false, "Non-owner should NOT be able to withdraw.");
    }

    function tryWithdrawAsNonOwner() public {
        // deploy a fresh Adoption to simulate wrong owner
        Adoption fake = new Adoption();
        fake.withdraw(); // should REVERT
    }

    function testOwnerWithdraws() public {
        // since test contract IS owner of deployed Adoption,
        // withdraw should succeed
        uint before = tester.balance;
        adoption.withdraw();
        uint afterBal = tester.balance;

        Assert.isTrue(afterBal >= before, "Owner balance must increase after withdrawal.");
    }

    // =====================================================
    // 6. Time Restriction (logic only)
    // =====================================================
    // We cannot simulate real time inside Solidity test,
    // but we test the adopt() at least works when called.
    function testAdoptDuringTestEnvironment() public {
        uint newId = adoption.adopt(7);
        Assert.equal(newId, 7, "Adoption should work normally (time logic handled in JS).");
    }
}
