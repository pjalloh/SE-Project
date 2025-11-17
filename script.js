document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CTA Button Logic (index.html) ---
    const ctaButton = document.querySelector('.cta');
    if (ctaButton) {
        ctaButton.addEventListener('click', () => {
            // Redirects the user to the Explore page when the button is clicked.
            window.location.href = 'explore.html';
        });
    }

    // --- 2. Profile Link Placeholder (profile.html) ---
    const editProfileLink = document.querySelector('.profile-card .cta-link');
    if (editProfileLink) {
        editProfileLink.addEventListener('click', (event) => {
            event.preventDefault(); // Stop the link from navigating immediately
            alert('Profile settings editor coming soon!');
        });
    }

    // --- 3. Search Bar Functionality (Global) ---
    const searchInput = document.querySelector('.search input[type="search"]');
    if (searchInput) {
        searchInput.addEventListener('keyup', filterDestinations);
    }
});

// --- 4. Search Filtering Function (Defined outside DOMContentLoaded) ---
function filterDestinations() {
    // Determine which page we are on to select the correct cards
    const isExplorePage = document.title.includes('Explore');
    const isFavoritesPage = document.title.includes('Favorites');

    // Only proceed if we are on a page with destination cards
    if (!isExplorePage && !isFavoritesPage) {
        return; 
    }

    // 1. Get the text entered by the user
    const searchTerm = document.querySelector('.search input[type="search"]').value.toLowerCase();
    
    // 2. Select all destination cards
    const destinations = document.querySelectorAll('.explore .destination');

    // 3. Loop through each card and check if it matches the search term
    destinations.forEach(destination => {
        // Get the city name from the <span> element inside the card
        const cityName = destination.querySelector('span').textContent.toLowerCase();

        if (cityName.includes(searchTerm)) {
            // Show the card if the city name contains the search term
            destination.style.display = 'block';
        } else {
            // Hide the card if it does not match
            destination.style.display = 'none';
        }
    });
}