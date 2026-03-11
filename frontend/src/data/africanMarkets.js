const AFRICAN_MARKETS = [
  { country: 'Algeria', cities: ['Algiers', 'Oran', 'Constantine'] },
  { country: 'Angola', cities: ['Luanda', 'Benguela', 'Huambo', 'Huíla', 'Namibe'] },
  { country: 'Botswana', cities: ['Gaborone', 'Francistown', 'Maun'] },
  { country: 'Cameroon', cities: ['Douala', 'Yaounde', 'Bafoussam'] },
  { country: 'Cape Verde', cities: ['Praia', 'Mindelo', 'Santa Maria'] },
  { country: "Cote d'Ivoire", cities: ['Abidjan', 'Yamoussoukro', 'Bouake'] },
  { country: 'Egypt', cities: ['Cairo', 'Alexandria', 'Giza'] },
  { country: 'Ethiopia', cities: ['Addis Ababa', 'Adama', 'Mekelle'] },
  { country: 'Ghana', cities: ['Accra', 'Kumasi', 'Tamale'] },
  { country: 'Kenya', cities: ['Nairobi', 'Mombasa', 'Kisumu'] },
  { country: 'Morocco', cities: ['Casablanca', 'Rabat', 'Marrakesh'] },
  { country: 'Mozambique', cities: ['Maputo', 'Beira', 'Nampula'] },
  { country: 'Namibia', cities: ['Windhoek', 'Walvis Bay', 'Swakopmund'] },
  { country: 'Nigeria', cities: ['Lagos', 'Abuja', 'Port Harcourt'] },
  { country: 'Rwanda', cities: ['Kigali', 'Musanze', 'Huye'] },
  { country: 'Senegal', cities: ['Dakar', 'Thies', 'Saint-Louis'] },
  { country: 'South Africa', cities: ['Johannesburg', 'Cape Town', 'Durban'] },
  { country: 'Tanzania', cities: ['Dar es Salaam', 'Dodoma', 'Arusha'] },
  { country: 'Tunisia', cities: ['Tunis', 'Sfax', 'Sousse'] },
  { country: 'Uganda', cities: ['Kampala', 'Entebbe', 'Gulu'] },
  { country: 'Zambia', cities: ['Lusaka', 'Ndola', 'Kitwe'] },
  { country: 'Zimbabwe', cities: ['Harare', 'Bulawayo', 'Mutare'] },
];

function sortValues(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}

export const AFRICAN_COUNTRIES = sortValues(
  AFRICAN_MARKETS.map(entry => entry.country),
);

export function getAfricanCitiesForCountry(country) {
  if (!country) return [];

  const market = AFRICAN_MARKETS.find(entry => entry.country.toLowerCase() === country.toLowerCase());
  return market ? sortValues(market.cities) : [];
}
