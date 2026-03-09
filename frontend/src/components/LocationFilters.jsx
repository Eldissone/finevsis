import { useI18n } from '../context/I18nContext.jsx';

function FilterRow({ label, options, activeValue, onChange, emptyLabel }) {
  return (
    <div className="filter-row">
      <div className="filter-label">{label}</div>
      <div className="filter-group">
        <button
          type="button"
          className={`filter-chip ${!activeValue ? 'filter-chip-active' : ''}`}
          onClick={() => onChange('')}
        >
          {emptyLabel}
        </button>
        {options.map(option => (
          <button
            type="button"
            key={option}
            className={`filter-chip ${activeValue === option ? 'filter-chip-active' : ''}`}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LocationFilters({ filters = {}, country = '', city = '', onCountryChange, onCityChange }) {
  const countries = filters.countries || [];
  const cities = filters.cities || [];
  const { messages } = useI18n();

  return (
    <div className="filter-panel">
      <FilterRow
        label={messages.common.country}
        options={countries}
        activeValue={country}
        emptyLabel={messages.common.allCountries}
        onChange={value => {
          onCountryChange(value);
          onCityChange('');
        }}
      />
      <FilterRow
        label={messages.common.city}
        options={cities}
        activeValue={city}
        emptyLabel={messages.common.allCities}
        onChange={onCityChange}
      />
    </div>
  );
}
