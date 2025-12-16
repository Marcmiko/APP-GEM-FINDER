
import React from 'react';
import { useSettings } from '../context/SettingsContext';

const SettingsPage: React.FC = () => {
  const { settings, setSettings } = useSettings();

  const handleBrandNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ brandName: e.target.value });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      <div className="mb-4">
        <label htmlFor="brandName" className="block text-sm font-medium text-gray-400">
          Brand Name
        </label>
        <input
          type="text"
          id="brandName"
          value={settings.brandName}
          onChange={handleBrandNameChange}
          className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
    </div>
  );
};

export default SettingsPage;
