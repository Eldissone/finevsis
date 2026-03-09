function sortValues(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}

export function normalizeOptionalString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildLocationWhere(query = {}) {
  const country = normalizeOptionalString(query.country);
  const city = normalizeOptionalString(query.city);
  const where = {};

  if (country) where.country = country;
  if (city) where.city = city;

  return { country, city, where };
}

export async function getLocationFilters(model, baseWhere = {}, activeCountry = null) {
  const countryRows = await model.findMany({
    where: {
      ...baseWhere,
      country: { not: null },
    },
    select: { country: true },
  });

  const cityRows = await model.findMany({
    where: {
      ...baseWhere,
      city: { not: null },
      ...(activeCountry ? { country: activeCountry } : {}),
    },
    select: { city: true },
  });

  return {
    countries: sortValues(countryRows.map(entry => entry.country?.trim()).filter(Boolean)),
    cities: sortValues(cityRows.map(entry => entry.city?.trim()).filter(Boolean)),
  };
}
