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
  
  getMeals();
