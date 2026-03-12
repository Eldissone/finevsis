import { useI18n } from '../context/I18nContext.jsx';

function sortValues(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}

function FilterSelect({ label, options, value, onChange, emptyLabel, disabled = false }) {
  return (
    <div className="filter-row">
      <div className="filter-label">{label}</div>
      <select
        className="form-field w-full"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{emptyLabel}</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

export default function LocationFilters({
  filters = {},
  country = '',
  city = '',
  onCountryChange,
  onCityChange,
  extraCountries = [],
  extraCities = [],
  onlyExtra = false,
}) {
  const countries = onlyExtra
    ? sortValues(extraCountries)
    : sortValues([...(filters.countries || []), ...extraCountries]);
  const cities = onlyExtra
    ? sortValues(extraCities)
    : sortValues([...(filters.cities || []), ...extraCities]);
  const { messages } = useI18n();

  return (
    <div className="filter-panel">
      <FilterSelect
        label={messages.common.country}
        options={countries}
        value={country}
        emptyLabel={messages.common.allCountries}
        onChange={value => {
          onCountryChange(value);
          onCityChange('');
        }}
      />
      <FilterSelect
        label={messages.common.city}
        options={cities}
        value={city}
        emptyLabel={messages.common.allCities}
        onChange={onCityChange}
        disabled={!country && cities.length === 0}
      />
    </div>
  );
}
