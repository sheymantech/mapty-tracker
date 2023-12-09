"use strict";

class workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // array of latt and long
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    // prettier-ignore
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',]
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()} `;
  }

  click() {
    this.clicks++;
  }
}
class running extends workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);

    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class cycling extends workout {
  type = "cycling";
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);

    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h

    this.speed = this.distance / (this.distance / 60);
    return this.speed;
  }
}

// const run = new running([39, -12], 5.2, 24, 178);

// const circle = new cycling([39, -12], 27, 95, 523);

// console.log(run, circle);

///////////////////////////////APPLICATION ARCHITECTURE

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class app {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();

    //  get data from local storage
    this._getLocalStorage();

    form.addEventListener("submit", this._newWorkout.bind(this));

    inputType.addEventListener("change", this._toggleElevationField);

    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),

        function () {
          alert("could not access your location");
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;

    const { longitude } = position.coords;

    console.log(latitude, longitude);

    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _hideForm() {
    // empty the value

    form.classList.add("hidden");
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");

    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    const validInput = (...input) => input.every((inp) => Number.isFinite(inp));

    const allpositive = (...input) => input.every((inp) => inp >= 0);

    e.preventDefault();

    // get the data from form

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //check if data is valid
    //if workout running create running object

    if (type === "running") {
      const cadence = +inputCadence.value;

      if (
        !validInput(distance, duration, cadence) ||
        !allpositive(distance, duration, cadence)
      )
        return alert("please input a  positive number");

      workout = new running([lat, lng], distance, duration, cadence);
    }
    //if workout cycling create running object

    if (type === "cycling") {
      const elevation = +inputElevation.value;

      if (
        !validInput(distance, duration, elevation) ||
        !allpositive(distance, duration)
      )
        return alert("please input a  positive number");

      workout = new cycling([lat, lng], distance, duration, elevation);
    }

    //Add new object to the workout array

    this.#workouts.push(workout);

    console.log(workout);

    //render workout on map as marker
    this._renderWorkoutMarker(workout);

    //render workout on the list
    this._renderWorkout(workout);

    //hide form and clear input field

    //clear input feild

    this._hideForm();

    //display marker

    // set local storage to all workout
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWithd: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    // console.log(workout.cadence);

    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
          }</span>
          <span class="workout__value"> ${workout.distance} </span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

    if (workout.type === "running")
      html += `

      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>`;

    if (workout.type === "cycling")
      html += `
       
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevation}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;

    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");
    // console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    // console.log(workout);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pin: {
        duration: 1,
      },
    });

    //using public interface

    // workout.click();
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data1 = JSON.parse(localStorage.getItem("workouts"));
    // console.log(data1);

    if (!data1) return;

    this.#workouts = data1;
    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem("workouts");

    location.reload();
  }
}

const App = new app();
