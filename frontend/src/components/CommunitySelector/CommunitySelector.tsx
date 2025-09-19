import React, { useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import type { Community } from '../../types';
import { getCommunityStatusColor } from '../../utils/statusColors';

interface CommunitySelectorProps {
  communities: Community[];
  selectedCommunity: Community | null;
  onCommunityChange: (community: Community) => void;
  mode: 'search' | 'list';
  onToggle: () => void;
}

const CommunitySelector: React.FC<CommunitySelectorProps> = ({
  communities,
  selectedCommunity,
  onCommunityChange,
  mode,
  onToggle
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatStatus = (status: string | undefined): string => {
    if (!status) return 'Unknown';
    
    switch (status.toLowerCase()) {
      case 'indevelopment':
        return 'In Development';
      case 'underconstruction':
        return 'Under Construction';
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'transition':
        return 'Transition';
      default:
        // For any other status, add spaces and capitalize properly
        return status
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
    }
  };

  const filteredCommunities = communities.filter(community =>
    (community.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (community.pcode || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedCommunities = filteredCommunities.sort((a, b) => {
    const nameA = (a.name || a.displayName || '').toLowerCase();
    const nameB = (b.name || b.displayName || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const handleCommunitySelect = (community: Community) => {
    onCommunityChange(community);
    setSearchTerm('');
  };

  if (mode === 'search') {
    return (
      <div className="h-full bg-surface-secondary border-b border-primary p-4 flex items-center theme-transition">
        <div className="flex items-center space-x-4 w-96 max-w-md">
          <div className="flex-1">
            <Combobox value={selectedCommunity} onChange={handleCommunitySelect}>
              <div className="relative">
                <Combobox.Input
                  className="w-full rounded-lg border border-primary bg-surface py-2 pl-3 pr-10 text-sm leading-5 text-primary focus:border-royal-500 focus:outline-none focus:ring-1 focus:ring-royal-500 theme-transition placeholder-tertiary"
                  displayValue={(community: Community | null) => community?.name || ''}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search communities..."
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-tertiary" aria-hidden="true" />
                </Combobox.Button>
              </div>
              <Transition
                as={React.Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setSearchTerm('')}
              >
                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-96 overflow-auto rounded-lg bg-surface py-1 text-base shadow-lg ring-1 ring-primary ring-opacity-20 focus:outline-none sm:text-sm theme-transition">
                  {sortedCommunities.length === 0 && searchTerm !== '' ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-secondary">
                      No communities found.
                    </div>
                  ) : (
                    sortedCommunities.map((community) => (
                      <Combobox.Option
                        key={community.pcode}
                        className={({ active }) =>
                          `relative cursor-default select-none py-3 pl-3 pr-9 theme-transition ${
                            active ? 'bg-royal-50 dark:bg-royal-900/30 text-royal-900 dark:text-royal-100' : 'text-primary'
                          }`
                        }
                        value={community}
                      >
                        {({ selected, active }) => (
                          <>
                            <div className="flex items-center">
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                {community.pcode} - {community.name}
                              </span>
                            </div>
                            {selected ? (
                              <span
                                className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                                  active ? 'text-royal-600' : 'text-royal-600'
                                }`}
                              >
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </Transition>
            </Combobox>
          </div>
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-10 h-10 bg-royal-600 text-white rounded-lg hover:bg-royal-700 focus:outline-none focus:ring-2 focus:ring-royal-500 focus:ring-offset-2 transition-colors theme-transition"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-surface-secondary theme-transition flex flex-col">
      {/* Header bar - matches MenuDropdowns height exactly */}
      <div className="p-4 flex items-center justify-between border-b-2 border-gray-600 dark:border-gray-700 flex-shrink-0" style={{ minHeight: '4rem' }}>
        <h2 className="text-xl font-semibold text-white">Select Community</h2>
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-10 h-10 bg-royal-600 text-white rounded-lg hover:bg-royal-700 focus:outline-none focus:ring-2 focus:ring-royal-500 focus:ring-offset-2 transition-colors theme-transition"
        >
          <MinusIcon className="h-5 w-5" />
        </button>
      </div>
      
      {/* Scrollable content area */}
      <div className="flex-1 p-6 overflow-y-auto bg-surface-secondary" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search communities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-primary bg-surface py-2 px-3 text-sm leading-5 text-primary focus:border-royal-500 focus:outline-none focus:ring-1 focus:ring-royal-500 theme-transition placeholder-tertiary"
          />
        </div>

        <div className="space-y-4">
          {sortedCommunities.map((community) => (
            <div
              key={community.pcode}
              onClick={() => handleCommunitySelect(community)}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:border-royal-500 hover:shadow-md hover:-translate-y-1 theme-transition ${
                selectedCommunity?.pcode === community.pcode
                  ? 'border-royal-500 bg-royal-50 dark:bg-royal-900/20 shadow-lg'
                  : 'border-transparent bg-surface shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border-2 theme-transition ${
                    selectedCommunity?.pcode === community.pcode
                      ? 'bg-royal-600 text-white border-royal-600'
                      : 'bg-transparent text-royal-600 dark:text-royal-400 border-royal-600 dark:border-royal-400'
                  }`}
                >
                  {community.pcode}
                </span>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border theme-transition ${getCommunityStatusColor(
                    community.status
                  )}`}
                >
                  {formatStatus(community.status)}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2 leading-tight">
                {community.name}
              </h3>
              <p className="text-sm text-secondary">
                <span className="font-semibold text-royal-600 dark:text-royal-400">{community.units}</span> Units
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunitySelector;
