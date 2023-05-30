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
    const url = "https://climate-change-in-tedu-campus-default-rtdb.europe-west1.firebasedatabase.app/recyclinglocations.json?orderBy=%22$key%22";
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      const keyNames = Object.keys(data);
  
      keyNames.forEach(function (key) {
        const card = document.createElement("div");
        card.classList.add("col-lg-3", "col-12", "col-md-5");
  
        const cardContent = document.createElement("div");
        cardContent.classList.add("wheretorecycle-thumb");
        cardContent.style.height = "500px";
  
        const titleContainer = document.createElement("div");
        titleContainer.classList.add("d-flex", "align-items-center", "border-bottom", "mb-4", "pb-3");
  
        const title = document.createElement("h3");
        title.classList.add("mb-0");
        title.style.fontSize = "40px";
        title.textContent = key;
  
        const description = document.createElement("p");
        description.textContent = null;
  
        const button = document.createElement("a");

        button.classList.add("custom-btn", "custom-border-btn", "btn", "mt-3", "mb-3");
        button.textContent = "Show Stations";
  
        button.addEventListener("click", function () {
          const details = data[key];
          createRecycleCards(details); // Call a function to create the cards for the selected item
        });
  
        description.appendChild(button);
  
        titleContainer.appendChild(title);
        cardContent.appendChild(titleContainer);
        cardContent.appendChild(description);
        card.appendChild(cardContent);
        recyclestations.appendChild(card);
      });
  
      const spinner = document.getElementById("waitingrecyclestations");
      if (spinner) {
        spinner.remove();
      }
    } catch (error) {
      console.log('Error getting recycle stations:', error);
    }
  }
  

  
  function createRecycleCards(details) {
    const modalBody = document.getElementById("modalBody");
    modalBody.innerHTML = ""; // Clear the modal body content
  
    details.forEach(function (item) {
      const stationItem = document.createElement("div");
      stationItem.classList.add("wheretorecycle-thumb");
  
      const stationInfo = document.createElement("div");
      stationInfo.classList.add("wheretorecycle-info");
  
      const location = document.createElement("small");
      location.classList.add("wheretorecycle-tag");
      location.textContent = item.location;
  
      const title = document.createElement("h4");
      title.classList.add("wheretorecycle-title");
      title.textContent = item.details;
  
      stationInfo.appendChild(location);
      stationInfo.appendChild(title);
  
      const popupImage = document.createElement("div");
      popupImage.classList.add("popup-image");
  
      const image = new Image();
      image.src = `data:image/jpeg;base64, ${item.image}`;
      image.classList.add("wheretorecycle-image");
      image.style.width = "250px";

      popupImage.style.display = "flex";
      popupImage.style.justifyContent = "center";
      popupImage.style.alignItems = "center";

  
      popupImage.appendChild(image);

      
  
      stationItem.appendChild(stationInfo);
      stationItem.appendChild(popupImage);
  
      modalBody.appendChild(stationItem);
    });
  
    // Open the modal
    const modal = new bootstrap.Modal(document.getElementById("recycleStationsModal"));
    modal.show();
  }
  
  

  getRecycleStations();
  
  getMeals();
