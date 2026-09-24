type VehiclePhoto = {
  slug: string
  original: string
  author: string
  seededUrl: string
}

const representativePhotos: Record<string, VehiclePhoto> = {
  "ford bronco sport": {
    slug: "bronco",
    original: "Ford_Bronco_Sport_Badlands_1X7A6296.jpg",
    author: "Alexander Migl",
    seededUrl: "https://images.unsplash.com/photo-1655121333961-4c7c3d08565f?auto=format&fit=crop&w=1400&q=85",
  },
  "honda accord hybrid": {
    slug: "accord",
    original: "2023_Honda_Accord_EX,_front_2.12.23.jpg",
    author: "Kevauto",
    seededUrl: "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1400&q=85",
  },
  "subaru outback": {
    slug: "outback",
    original: "2023_Subaru_Outback_Premium,_front_right,_09-09-2023.jpg",
    author: "MercurySable99",
    seededUrl: "https://images.unsplash.com/photo-1624450993559-867f4f28d9ba?auto=format&fit=crop&w=1400&q=85",
  },
  "hyundai palisade": {
    slug: "palisade",
    original: "2023_Hyundai_Palisade_Ultimate_Calligraphy_in_Typhoon_Silver,_front_right,_2024-03-31.jpg",
    author: "Elise240SX",
    seededUrl: "https://images.unsplash.com/photo-1679089848144-0134f7215ecb?auto=format&fit=crop&w=1400&q=85",
  },
  "hyundai santa fe": {
    slug: "santa-fe",
    original: "2024_Hyundai_Santa_Fe_Luxury_AWD_in_Hampton_Grey,_front_left,_2024-06-30.jpg",
    author: "Elise240SX",
    seededUrl: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1400&q=85",
  },
}

export function vehiclePhoto(vehicle: { make: string; model: string; imageUrl: string }) {
  const photo = representativePhotos[`${vehicle.make} ${vehicle.model}`.toLowerCase()]
  // Use local, reviewed images only for the initial seeded Unsplash URLs.
  // A newly uploaded admin image takes precedence without a code change.
  if (!photo || vehicle.imageUrl !== photo.seededUrl) {
    return { src: vehicle.imageUrl, attribution: null }
  }
  return {
    src: `${import.meta.env.BASE_URL}vehicles/${photo.slug}.webp`,
    attribution: {
      author: photo.author,
      href: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(photo.original)}`,
    },
  }
}