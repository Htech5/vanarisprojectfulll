const specs = [
  {
    id: 'camera',
    title: 'Camera Specs',
    subtitle: 'Thermal + optical imaging stack',
    items: [
      { label: 'Sensor', value: '1/1.7-inch' },
      { label: 'Thermal Res', value: '640x512' },
      { label: 'Super-Wide FOV', value: '162°' },
      { label: 'Color Mode', value: 'D-Cinelike' },
    ],
  },
  {
    id: 'video',
    title: 'Video Specs',
    subtitle: 'Transmission and capture limits',
    items: [
      { label: 'Max Video Quality', value: '4K/60fps' },
      { label: 'Max Frame Rate', value: '120 Fps' },
      { label: 'Transmission Range', value: '14.3 Km' },
      { label: 'Lowest Latency', value: '1080p' },
    ],
  },
  {
    id: 'aircraft',
    title: 'Aircraft Specs',
    subtitle: 'Flight envelope and endurance',
    items: [
      { label: 'Max Flight Time', value: '47.2 min' },
      { label: 'Max Speed', value: '97 km/h' },
      { label: 'Wind Resistance', value: 'Level 7' },
      { label: 'IP Rating', value: 'IP45' },
    ],
  },
];

module.exports = { specs };
