async function getMeals() {
    const todaysDate = new Date().toISOString().slice(0, 10);
    const url = `https://climate-change-in-tedu-campus-default-rtdb.europe-west1.firebasedatabase.app/meals.json?orderBy="Date"&equalTo="${todaysDate}"`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      // Loop through the data and create HTML elements for each meal
      Object.values(data).forEach(function(data) {
        const mealItem = document.createElement("div");
        mealItem.classList.add("col-lg-4", "col-12");
        mealItem.innerHTML = `
          <div class="carbonfootprint-thumb" style="height: 500px;">
            <div class="d-flex align-items-center border-bottom mb-4 pb-3">
              <h3 class="mb-0" style="font-size: 40px;">${data.Meal}</h3>
              <div class="carbonfootprint-price-wrap ms-auto">
                <p class="carbonfootprint-price-text mb-0">${data.carbonemission} kg CO2</p>
                <div class="carbonfootprint-price-overlay"></div>
              </div>
            </div>
            <p>${data.Details}</p>
          </div>
        `;
        todaysmeallistdiv.appendChild(mealItem);
      });
  
      // Remove the spinner element
      const spinner = document.getElementById("waitingtodaysmeal");
      if (spinner) {
        spinner.remove();
      }
    } catch (error) {
      console.log('Error getting meals:', error);
    }
  }

  async function getRecycleStations() {
    const url = "https://climate-change-in-tedu-campus-default-rtdb.europe-west1.firebasedatabase.app/recyclinglocations.json";
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      // Loop through the data and create HTML elements for each recycle station
      // Loop through the data and create HTML elements for each recycle station
        Object.values(data).forEach(function (data) {
          const stationItem = document.createElement("div");
          stationItem.classList.add("col-lg-3", "col-md-5", "col-12");
          stationItem.innerHTML = `
            <div class="wheretorecycle-thumb">
              <div class="wheretorecycle-info">
                <small class="wheretorecycle-tag">${data.location}</small>
                <h4 class="wheretorecycle-title">${data.details}</h4>
              </div>

              <div class="popup-image">
                <img class="wheretorecycle-image img-fluid mx-auto" style="width: 250px;" alt="">
              </div>
            </div>
          `;

          // Create an image element and set its src attribute using the base64 string
          const image = new Image();
          image.src = `data:image/jpeg;base64, ${data.image}`;
          image.classList.add("wheretorecycle-image");
          stationItem.querySelector(".popup-image").appendChild(image);

          recyclestations.appendChild(stationItem);
        });

  
      // Add click event listener to show the modal with details
      const modalButton = document.querySelectorAll('[data-toggle="modal"]');
      modalButton.forEach(function (button) {
        button.addEventListener("click", function () {
          const details = this.getAttribute("data-details");
          document.getElementById("modalDetails").textContent = details;
        });
      });

      const spinner = document.getElementById("waitingrecyclestations");
      if (spinner) {
        spinner.remove();
      }
    } catch (error) {
      console.log('Error getting recycle stations:', error);
    }
  }
  

  getRecycleStations();
  
  getMeals();
