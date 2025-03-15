let guestInput = document.getElementById("guest-count");
let inputDate = document.getElementById("date-input");
let secondDate = document.getElementById("input-2");
let submitButton = document.getElementById("submit-button");

async function fetchRoomDetails() {
  try {
    const roomId = localStorage.getItem("selectedRoomId");
    if (!roomId) {
      alert("No room selected.");
      return;
    }

    const response = await fetch(
      "https://hotelbooking.stepprojects.ge/api/Rooms/GetAll"
    );
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }

    const roomsData = await response.json();
    const room = roomsData.find((r) => r.id == roomId);

    if (room) {
      // Display the room details
      const roomInfoDiv = document.getElementById("room-info");
      roomInfoDiv.innerHTML = `
        <div class="maindiv">
          <img src="${
            room.images[0]?.source || "https://via.placeholder.com/300"
          }" alt="${room.name}" class="book-img"/>
          <h2>${room.name}</h2>
          <p><strong>Price per Night:</strong> $${
            room.pricePerNight || "N/A"
          }</p>
          <p><strong>Maximum Guests:</strong> ${
            room.maximumGuests || "Description not available"
          }</p>
          <p><strong>Availability:</strong> ${
            room.available ? "Available" : "Not Available"
          }</p>
        </div>
      `;

      guestInput.setAttribute("max", room.maximumGuests);

      let today = new Date().toISOString().split("T")[0];
      inputDate.min = today;
      secondDate.min = today;

      // Check availability when dates are changed
      inputDate.addEventListener("change", () => checkAvailability(room));
      secondDate.addEventListener("change", () => checkAvailability(room));

      // Add event listener to the "Book Now" button
      submitButton.addEventListener("click", () => bookRoom(room));
    } else {
      alert("Room not found");
    }
  } catch (error) {
    console.error("Error fetching room details:", error);
  }
}

function checkAvailability(room) {
  let startDate = new Date(inputDate.value);
  let endDate = new Date(secondDate.value);

  if (!inputDate.value || !secondDate.value) {
    Swal.fire({
      icon: "warning",
      title: "Select Dates",
      text: "Please select both check-in and check-out dates.",
    });
    return;
  }

  if (endDate <= startDate) {
    Swal.fire({
      icon: "warning",
      title: "Invalid Date Selection",
      text: "Check-out date must be after check-in date.",
    });
    return;
  }

  // Convert the bookedDates array into a more manageable format (array of Date objects)
  let bookedDates = room.bookedDates?.map((b) => new Date(b.date)) || [];

  // Check if any of the booked dates overlap with the selected date range
  let isUnavailable = bookedDates.some(
    (bookedDate) => bookedDate >= startDate && bookedDate < endDate
  );

  if (isUnavailable) {
    Swal.fire({
      icon: "error",
      title: "Room Not Available!",
      text: "The selected dates are unavailable. Please choose different dates.",
    });
  } else {
    Swal.fire({
      icon: "success",
      title: "Room Available!",
      text: "The selected dates are available for booking.",
    });
  }
}

// Function to book the room
async function bookRoom(room) {
  let startDate = new Date(inputDate.value);
  let endDate = new Date(secondDate.value);
  const guestCount = guestInput.value;

  // Validate the booking form
  if (!inputDate.value || !secondDate.value || !guestCount) {
    Swal.fire({
      icon: "warning",
      title: "Please Fill All Fields",
      text: "Please select dates and enter guest count.",
    });
    return;
  }

  // Check if the room is available
  let bookedDates = room.bookedDates?.map((b) => new Date(b.date)) || [];
  let isUnavailable = bookedDates.some(
    (bookedDate) => bookedDate >= startDate && bookedDate < endDate
  );

  if (isUnavailable) {
    Swal.fire({
      icon: "error",
      title: "Room Not Available!",
      text: "The selected dates are unavailable. Please choose different dates.",
    });
    return;
  }

  // Room is available, proceed to book
  const bookingData = {
    roomId: room.id,
    roomName: room.name,
    checkIn: startDate.toISOString(),
    checkOut: endDate.toISOString(),
    guests: guestCount,
  };

  // Post booking data to the API
  try {
    const response = await fetch(
      "https://67d545b6d2c7857431efdfb5.mockapi.io/book",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      }
    );

    if (response.ok) {
      const bookingResponse = await response.json();
      // Save booking info to localStorage
      let bookedRooms = JSON.parse(localStorage.getItem("bookedRooms")) || [];
      bookedRooms.push(bookingResponse);
      localStorage.setItem("bookedRooms", JSON.stringify(bookedRooms));

      Swal.fire({
        icon: "success",
        title: "Booking Successful",
        text: `Your room has been booked from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}.`,
      });
    } else {
      throw new Error("Booking failed. Please try again.");
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Booking Failed",
      text: error.message,
    });
  }
}

document.addEventListener("DOMContentLoaded", fetchRoomDetails);

document.querySelector(".fa-bars").addEventListener("click", function () {
  const menu = document.querySelector("ul");
  menu.style.display = menu.style.display === "none" ? "flex" : "none";
});
