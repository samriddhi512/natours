/* eslint-disable */
const displayMap = locations => {
  // Initialize the map with initial view
  const map = L.map('map', {
    scrollWheelZoom: false
  }).setView([locations[0].coordinates[1], locations[0].coordinates[0]], 4);

  // Add the tile layer (the map background)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }).addTo(map);

  // Create bounds object
  const bounds = L.latLngBounds();

  // Add markers and popups for each location
  locations.forEach(loc => {
    // Create marker element
    const el = document.createElement('div');
    el.className = 'marker';

    // Create marker with custom element
    const marker = L.marker([loc.coordinates[1], loc.coordinates[0]], {
      icon: L.divIcon({
        className: 'marker',
        html: el,
        iconSize: [32, 40],
        iconAnchor: [16, 40]
      })
    }).addTo(map);

    // Add popup
    marker.bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, {
      offset: L.point(0, -30)
    }).openPopup();

    // Extend bounds to include current location
    bounds.extend([loc.coordinates[1], loc.coordinates[0]]);
  });

  // Calculate the center and zoom level with padding
  const padding = [200, 150, 100, 100];
  const center = bounds.getCenter();
  const zoom = map.getBoundsZoom(bounds, false, padding);

  // Animate to the final position
  map.flyToBounds(bounds, {
    padding: padding,
    duration: 2,
    easeLinearity: 0.25
  });
};
