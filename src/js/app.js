App = {
  web3Provider: null,
  contracts: {},
  // Store all pets data (original + registered)
  allPets: [], 



  init: async function() {
    // Load pets from pets.json and render cards
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');


      for (var i = 0; i < data.length; i++) {
        var petData = data[i];
        
        // ------- added: store to allPets -------
        App.allPets.push({
          id: petData.id,
          name: petData.name,
          breed: petData.breed,
          age: petData.age,
          location: petData.location,
          picture: petData.picture,
          isAdopted: false,
          type: "original"
        });
        // ------------------------------------
        var petPanel = petTemplate.clone();
        petPanel.removeAttr('id').css('display', 'block'); 
        
        petPanel.find('.panel-title').text(petData.name);
        petPanel.find('img').attr('src', petData.picture);
        petPanel.find('.pet-breed').text(petData.breed);
        petPanel.find('.pet-age').text(petData.age);
        petPanel.find('.pet-location').text(petData.location);
        // Important: Original pets use data-type='original'
        petPanel.find('.btn-adopt').attr('data-id', petData.id).attr('data-type', 'original'); 
        petPanel.find('.btn-like').attr('data-id', petData.id);
        petPanel.find('.like-count').attr('data-id', petData.id);

        
        petsRow.append(petPanel.html());
      }
      
      petTemplate.css('display', 'none'); 
    });
    App.bindEvents();
    return await App.initWeb3();
  },


  initWeb3: async function() {
    // Modern dapp browsers
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
    }
    // Legacy dapp browsers
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // Fallback to Ganache (local)
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }

    // Initialize web3 with the provider
    web3 = new Web3(App.web3Provider);

    return App.initContract().then(() => {
        return App.markAdoptedIntoAllPets();
    }).then(() => {
        $("#petsRow").empty();
        App.allPets.forEach(p => App.renderSinglePet(p));
        return App.markAdopted();
    });

  },

  // Explicit user-initiated connection to MetaMask
  connectWallet: async function() {
    if (!window.ethereum) {
      alert('MetaMask is not available in this browser.');
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      console.log('Connected account:', accounts[0]);

      var btn = document.getElementById('connectButton');
      if (btn && accounts && accounts[0]) {
        btn.textContent =
          'Connected: ' +
          accounts[0].slice(0, 6) +
          '...' +
          accounts[0].slice(-4);
      }
    } catch (error) {
      console.error('Error requesting accounts:', error);
    }
  },



  initContract: function() {
    return $.getJSON('Adoption.json', function(data) {
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
      App.contracts.Adoption.setProvider(App.web3Provider);
        
      return App.getAndDisplayRegisteredPets();
    });
  },



  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '#connectButton', App.connectWallet);
    $(document).on('click', '#registerPetButton', App.handleRegisterPet); 
    $(document).on('click', '.btn-like', App.handleToggleLike);
    $(document).on('click', '#btn-my-likes', App.showMyLikes);
    $(document).on('click', '#btn-filter', App.applyFilter);
    $(document).on('click', '#btn-reset-filter', App.resetFilter);
    $(document).on('click', '#donateButton', App.donate);
    $(document).on('click', '#withdrawButton', App.withdraw);
  },

  // check if current time is during business hours (9am-9pm UTC-5)
  isDuringBusinessHours: function() {
    const now = new Date();
    const utcMinus5 = new Date(now.getTime() - (5 * 60 * 60 * 1000)); // UTC-5
    const hours = utcMinus5.getUTCHours();
    const minutes = utcMinus5.getUTCMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    // // Business hours 9:00 AM - 9:00 PM (UTC-5)
    const openMinutes = 9 * 60; // 9:00 AM
    const closeMinutes = 21 * 60; // 9:00 PM
    // Business hours: 00:00 to 24:00 (always open)
    // const openMinutes = 0;        // midnight
    // const closeMinutes = 24 * 60; // 1440 minutes
    
    return totalMinutes >= openMinutes && totalMinutes < closeMinutes;
  },

  // show warning for non-business hours
  showBusinessHoursWarning: function() {
    alert("Pet Shop is currently closed.\n\nBusiness Hours: 9:00 AM - 9:00 PM (UTC-5)\nPlease try again during business hours.");
  },
  


  // New function to get and display registered pets
  getAndDisplayRegisteredPets: function() {

    var adoptionInstance;
    var petTemplate = $('#petTemplate');
    var petsRow = $('#petsRow');

    // Clear old registered pet cards
    $('.registered-pet').remove();
    // remove old registered pets from allPets
    App.allPets = App.allPets.filter(p => p.type === "original");

    App.contracts.Adoption.deployed()
      .then(function(instance) {
        adoptionInstance = instance;
        return adoptionInstance.getRegisteredPetsCount.call();
      })
      .then(async function(count) {

        for (let i = 0; i < count; i++) {
          let pet = await adoptionInstance.registeredPets(i);

          let id = i + 16;

          // avoid duplicates in allPets
          if (!App.allPets.find(p => p.id === id)) {
            App.allPets.push({
              id: id,
              name: pet[0],
              breed: pet[1],
              age: pet[2].toNumber(),
              location: pet[3],
              picture: pet[4],
              isAdopted: pet[6],
              type: "registered"
            });
          }

          // UI
          let petPanel = petTemplate.clone();
          petPanel.removeAttr('id').css('display', 'block');
          petPanel.children().first().addClass('registered-pet');

          petPanel.find('.panel-title').text(pet[0] + ' (Registered Pet)');
          petPanel.find('img').attr('src', pet[4]);
          petPanel.find('.pet-breed').text(pet[1]);
          petPanel.find('.pet-age').text(pet[2]);
          petPanel.find('.pet-location').text(pet[3]);

          petPanel.find('.btn-adopt')
            .attr('data-id', i)
            .attr('data-type', 'registered');

          petPanel.find('.btn-like').attr('data-id', id);
          petPanel.find('.like-count').attr('data-id', id);

          if (pet[6]) {
            petPanel.find('.btn-adopt').text('Success').attr('disabled', true);
          }

          petsRow.append(petPanel.html());
        }

        App.refreshAllLikes(count);
        return App.markAdoptedIntoAllPets();
      })
      .then(() => App.fillFilterOptions())
      .catch(err => console.log(err));
  },



  markAdopted: function() {
    var adoptionInstance;

    App.contracts.Adoption.deployed()
      .then(function(instance) {
        adoptionInstance = instance;
        return adoptionInstance.getAdopters.call();
      })
      .then(function(adopters) {

        for (var i = 0; i < adopters.length; i++) {
          if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
            var button = $('.btn-adopt[data-id="' + i + '"][data-type="original"]');
            if (button.length) {
              button.text('Success').attr('disabled', true);
            }
          }
        }
      })
      .catch(function(err) {
        console.log(err.message);
      });
  },

  markAdoptedIntoAllPets: async function () {
    const adoptionInstance = await App.contracts.Adoption.deployed();
    const adopters = await adoptionInstance.getAdopters.call();

    // original pets
    for (let i = 0; i < 16; i++) {
        const found = App.allPets.find(p => p.id === i);
        if (found) {
            found.isAdopted = (adopters[i] !== '0x0000000000000000000000000000000000000000');
        }
    }

    // registered pets
    const regCount = (await adoptionInstance.getRegisteredPetsCount()).toNumber();
    for (let j = 0; j < regCount; j++) {
        const pet = await adoptionInstance.registeredPets(j);
        const found = App.allPets.find(p => p.id === j + 16);
        if (found) {
            found.isAdopted = pet[6];
        }
    }
  },



  handleAdopt: function(event) {
    event.preventDefault();

    //Check business hours before proceeding
    if (!App.isDuringBusinessHours()) {
      App.showBusinessHoursWarning();
      return;
    }

    var petId = parseInt($(event.target).data('id'));
    var petType = $(event.target).data('type');
    var adoptionInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
        return;
      }

      if (!accounts || accounts.length === 0) {
        console.log('No accounts available. Make sure MetaMask is connected.');
        return;
      }

      var account = accounts[0];

      App.contracts.Adoption.deployed()
        .then(function(instance) {
          adoptionInstance = instance;

          if (petType === 'original') {
            // original pets - call the original adopt function
            return adoptionInstance.adopt(petId, { from: account });
          } else if (petType === 'registered') {
            // newly registered pets - call the new adoptRegisteredPet function
            return adoptionInstance.adoptRegisteredPet(petId, { from: account });
          } else {
            throw new Error("Unknown pet type for adoption.");
          }
        })
        .then(function(result) {
          // update adoption status for all pets (both newly registered and original)
          return App.markAdoptedIntoAllPets().then(() => {
              $("#petsRow").empty();
              App.allPets.forEach(p => App.renderSinglePet(p));
          });

        })
        .catch(function(err) {
          App.handleTxError(err, "Adoption");
        });
    });
  },



  handleRegisterPet: function(event) { 
      event.preventDefault();

      // Check business hours before proceeding
      if (!App.isDuringBusinessHours()) {
        App.showBusinessHoursWarning();
        return;
      }
      var name = $('#petName').val();
      var breed = $('#petBreed').val();
      var age = parseInt($('#petAge').val());
      var location = $('#petLocation').val();
      var pictureUrl = $('#petPictureUrl').val();
      
      if (!name || !breed || isNaN(age) || !location || !pictureUrl) {
          alert('Please complete all fields for pet registration.');
          return;
      }

      var adoptionInstance;

      var registrationFee = web3.toWei('0.01', 'ether');

      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
          return;
        }

        if (!accounts || accounts.length === 0) {
          console.log('No accounts available. Please connect your wallet.');
          return;
        }

        var account = accounts[0];

        App.contracts.Adoption.deployed()
          .then(function(instance) {
            adoptionInstance = instance;

            // Execute registerPet, passing all arguments
            return adoptionInstance.registerPet(
              name,
              breed,
              age,
              location,
              pictureUrl,
              { 
                from: account,
                value: registrationFee // Send 0.01 ETH
              }
            );
          })
          .then(function(result) {
            console.log('Pet Registered!', result);
            alert('Pet registered successfully! Waiting for the transaction to be mined.');
            // Clear the form fields
            $('#petName').val('');
            $('#petBreed').val('');
            $('#petAge').val('');
            $('#petLocation').val('');
            $('#petPictureUrl').val('');
            // reload and display registered pets
            return App.getAndDisplayRegisteredPets(); 
          })
          .catch(function(err) {
            console.error('Error registering pet:', err.message);
            alert('Error: ' + err.message.substring(0, 150) + '...');
          });
      });
    },

  reloadAllPets: async function () {
    $("#petsRow").empty();

    // Clear all caches
    App.allPets = [];

    // reload original pets (pets.json)
    await $.getJSON('../pets.json', function(data) {
        var petTemplate = $('#petTemplate');
        var petsRow = $('#petsRow');

        data.forEach(p => {
            App.allPets.push({
                id: p.id,
                name: p.name,
                breed: p.breed,
                age: p.age,
                location: p.location,
                picture: p.picture,
                isAdopted: false,
                type: "original"
            });
        });
    });

    // load registered pets from blockchain
    await App.getAndDisplayRegisteredPets();

    // sync adoption status
    await App.markAdoptedIntoAllPets();

    // redender all pets
    App.allPets.forEach(p => App.renderSinglePet(p));
  },


  handleToggleLike: function(event) {
    event.preventDefault();

    const petId = parseInt($(event.target).data('id'));

    web3.eth.getAccounts(function(err, accounts) {
        if (err) return console.log(err);
        if (!accounts || accounts.length === 0) {
            alert("Please connect Wallet first");
            return;
        }

        const account = accounts[0];

        App.contracts.Adoption.deployed()
            .then(instance => instance.toggleLike(petId, { from: account }))
            .then(() => {
                App.updateLikeDisplay(petId);

                // --- Only refresh content, not toggle UI ---
                if ($("#my-likes-container").is(":visible")) {
                    App.refreshMyLikesList();
                }
            })
            .catch(err => console.error(err));
    });
  },

  updateLikeDisplay: function(petId) {
    App.contracts.Adoption.deployed()
        .then(instance => instance.petLikes(petId))
        .then(count => {
            $('.like-count[data-id="' + petId + '"]').text("Likes: " + count);
        })
        .catch(err => console.error(err));
  },

  // Refresh like counts for all pets (original 16 + registered count)
  refreshAllLikes: function(registeredCount) {
    var n = registeredCount;
    if (typeof registeredCount === 'object' && registeredCount.toNumber) {
      n = registeredCount.toNumber();
    } else {
      n = parseInt(registeredCount);
    }

    var totalPets = 16 + n;
    for (var i = 0; i < totalPets; i++) {
      App.updateLikeDisplay(i);
    }
  },


  showMyLikes: function() {
    var container = $("#my-likes-container");

    // toggle section
    if (container.is(":visible")) {
        container.slideUp();
        return;
    }

    container.slideDown(); 
    App.refreshMyLikesList();   // refresh content
  },

  refreshMyLikesList: function() {
    var listBox = $("#my-likes-list");
    listBox.empty();

    web3.eth.getAccounts(function(err, accounts) {
        if (err) return console.log(err);
        if (!accounts.length) {
            listBox.append(`<li class="list-group-item">Wallet not connected.</li>`);
            return;
        }

        var account = accounts[0];

        App.contracts.Adoption.deployed()
            .then(instance => instance.getMyLikedPets({ from: account }))
            .then(petIds => {
                listBox.empty();

                if (petIds.length === 0) {
                    listBox.append(
                        `<li class="list-group-item">You haven't liked any pets yet.</li>`
                    );
                    return;
                }

                petIds.forEach(id => {
                    const petId = id.toNumber();
                    listBox.append(
                        `<li class="list-group-item">❤️ Pet ${petId}</li>`
                    );
                });
            })
            .catch(err => console.error(err));
    });
  },

  
  
  applyFilter: async function() {
    await App.markAdoptedIntoAllPets();
    const breed = $("#filterBreed").val();
    const location = $("#filterLocation").val();
    const status = $("#filterStatus").val();
    const ageMin = parseInt($("#ageMin").val());
    const ageMax = parseInt($("#ageMax").val());

    $("#petsRow").empty();

    let filtered = App.allPets.filter(p => {
        if (breed && p.breed !== breed) return false;
        if (location && p.location !== location) return false;
        if (status === "adopted" && p.isAdopted !== true) return false;
        if (status === "notadopted" && p.isAdopted !== false) return false;
        if (!isNaN(ageMin) && p.age < ageMin) return false;
        if (!isNaN(ageMax) && p.age > ageMax) return false;
        return true;
    });

    filtered.forEach(p => App.renderSinglePet(p));
  },


  resetFilter: async function() {
    await App.markAdoptedIntoAllPets();

    $("#filterBreed").val("");
    $("#filterLocation").val("");
    $("#filterStatus").val("all");
    $("#ageMin").val("");
    $("#ageMax").val("");

    $("#petsRow").empty();
    App.allPets.forEach(p => App.renderSinglePet(p));
  },



  renderSinglePet: function(p) {
    var petTemplate = $('#petTemplate');
    var petsRow = $('#petsRow');

    var petPanel = petTemplate.clone();
    petPanel.removeAttr('id').css('display', 'block');

    petPanel.find('.panel-title').text(p.name);
    petPanel.find('img').attr('src', p.picture);
    petPanel.find('.pet-breed').text(p.breed);
    petPanel.find('.pet-age').text(p.age);
    petPanel.find('.pet-location').text(p.location);

    // adopt button
    petPanel.find('.btn-adopt')
        .attr('data-id', p.id)
        .attr('data-type', p.type);

    // like button
    petPanel.find('.btn-like').attr('data-id', p.id);
    petPanel.find('.like-count').attr('data-id', p.id);

    // adoption status
    if (p.isAdopted) {
        petPanel.find('.btn-adopt').text('Success').attr('disabled', true);
    }

    petsRow.append(petPanel);

    // -------- FIX #1: Reload correct like count --------
    App.updateLikeDisplay(p.id);
  },


  fillFilterOptions: function () {
    let breeds = new Set();
    let locations = new Set();

    App.allPets.forEach(p => {
        breeds.add(p.breed);
        locations.add(p.location);
    });

    // 填入 Breed
    const breedSelect = $("#filterBreed");
    breedSelect.empty();
    breedSelect.append(`<option value="">All Breeds</option>`);
    breeds.forEach(b => breedSelect.append(`<option value="${b}">${b}</option>`));

    // 填入 Location
    const locationSelect = $("#filterLocation");
    locationSelect.empty();
    locationSelect.append(`<option value="">All Locations</option>`);
    locations.forEach(loc => locationSelect.append(`<option value="${loc}">${loc}</option>`));
  },

  donate: async function () {
    const donationInput = document.getElementById("donationAmount");
    if (!donationInput) {
      alert("Donation input not found in the page.");
      return;
    }

    let amount = donationInput.value;

    if (!amount || amount <= 0) {
      alert("Please enter a valid donation amount");
      return;
    }

    // web3 v0.19 (included) uses callback-style getAccounts — use callback to stay compatible
    web3.eth.getAccounts(function(err, accounts) {
      if (err) {
        console.error(err);
        alert("Donation failed.");
        return;
      }

      if (!accounts || accounts.length === 0) {
        alert("Please connect your wallet before donating.");
        return;
      }

      const account = accounts[0];
      const amountWei = web3.toWei(amount.toString(), "ether");

      App.contracts.Adoption.deployed()
        .then(instance => instance.donate({ from: account, value: amountWei }))
        .then(() => {
          alert("Thank you for donating!");
          donationInput.value = "";
        })
        .catch(error => {
          console.error(error);
          alert("Donation failed.");
        });
    });
  },

  withdraw: async function () {
    // use callback-style getAccounts for compatibility with web3 v0.19
    web3.eth.getAccounts(function(err, accounts) {
      if (err) {
        console.error(err);
        alert("Withdrawal failed.");
        return;
      }

      if (!accounts || accounts.length === 0) {
        alert("Please connect your wallet before attempting withdrawal.");
        return;
      }

      const account = accounts[0];

      App.contracts.Adoption.deployed()
        .then(instance => instance.withdraw({ from: account }))
        .then(() => alert("Withdrawal successful!"))
        .catch(error => {
          console.error(error);
          alert("Only the owner can withdraw funds.");
        });
    });
  },
  //More functions can be added here
};


$(function() {
  $(window).load(function() {
    App.init();
  });
});


