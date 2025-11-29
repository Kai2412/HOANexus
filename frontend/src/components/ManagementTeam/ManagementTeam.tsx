import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  UserIcon, 
  PlusIcon,
  CogIcon,
  DocumentDuplicateIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import type { Community } from '../../types';
import { ManagementTeamService } from '../../services';
import type { ManagementTeamMember } from '../../services/managementTeamService';
import logger from '../../services/logger';

interface ManagementTeamProps {
  community: Community;
  onRequestAssignment?: () => void;
}

const ManagementTeam: React.FC<ManagementTeamProps> = ({ community, onRequestAssignment }) => {
  const [teamMembers, setTeamMembers] = useState<ManagementTeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadManagementTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const teamData = await ManagementTeamService.getManagementTeam(community.id);
      setTeamMembers(teamData);
    } catch (err) {
      logger.error('Error loading management team', 'ManagementTeam', { communityId: community.id }, err as Error);
      setError('Failed to load management team');
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagementTeam();
  }, [community.id]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      logger.warn('Failed to copy to clipboard', 'ManagementTeam', { field: fieldName }, err as Error);
    }
  };

  const getRoleIcon = (roleType: string) => {
    switch (roleType) {
      case 'Director':
        return <UserIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      case 'Manager':
        return <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'Assistant':
        return <UserIcon className="h-5 w-5 text-green-600 dark:text-green-400" />;
      default:
        return <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (roleType: string) => {
    switch (roleType) {
      case 'Director':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'Manager':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'Assistant':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const groupedMembers = {
    Director: teamMembers.filter(m => m.roleType === 'Director' && m.isActive),
    Manager: teamMembers.filter(m => m.roleType === 'Manager' && m.isActive),
    Assistant: teamMembers.filter(m => m.roleType === 'Assistant' && m.isActive)
  };

  const handleRequestAssignment = () => {
    if (onRequestAssignment) {
      onRequestAssignment();
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserGroupIcon className="h-6 w-6 text-royal-600 dark:text-royal-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Management Team
          </h3>
        </div>
        
        {/* Action Button */}
        <div>
          <button
            onClick={handleRequestAssignment}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-royal-600 hover:text-royal-700 dark:text-royal-400 dark:hover:text-royal-300 hover:bg-royal-50 dark:hover:bg-royal-900/20 rounded-md transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Request Assignment
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-royal-200 border-t-royal-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-sm text-royal-600 hover:text-royal-700 dark:text-royal-400"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Director Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {getRoleIcon('Director')}
              <h4 className="font-medium text-gray-900 dark:text-white">Director</h4>
            </div>
            {groupedMembers.Director.length > 0 ? (
              <div className="space-y-2">
                {groupedMembers.Director.map((member) => (
                  <div key={member.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {member.firstName} {member.lastName}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(member.roleType)}`}>
                        {member.roleTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <span>{member.email}</span>
                        <button
                          onClick={() => copyToClipboard(member.email, `email-${member.id}`)}
                          className="p-1 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                          title="Copy email to clipboard"
                        >
                          {copiedField === `email-${member.id}` ? (
                            <CheckIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                          ) : (
                            <DocumentDuplicateIcon className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      {member.mobilePhone && (
                        <div className="flex items-center gap-1">
                          <span>{member.mobilePhone}</span>
                          <button
                            onClick={() => copyToClipboard(member.mobilePhone!, `mobile-${member.id}`)}
                            className="p-1 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                            title="Copy mobile phone to clipboard"
                          >
                            {copiedField === `mobile-${member.id}` ? (
                              <CheckIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                            ) : (
                              <DocumentDuplicateIcon className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No director assigned</p>
              </div>
            )}
          </div>

          {/* Manager Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {getRoleIcon('Manager')}
              <h4 className="font-medium text-gray-900 dark:text-white">Manager</h4>
            </div>
            {groupedMembers.Manager.length > 0 ? (
              <div className="space-y-2">
                {groupedMembers.Manager.map((member) => (
                  <div key={member.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {member.firstName} {member.lastName}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(member.roleType)}`}>
                        {member.roleTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <span>{member.email}</span>
                        <button
                          onClick={() => copyToClipboard(member.email, `email-${member.id}`)}
                          className="p-1 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                          title="Copy email to clipboard"
                        >
                          {copiedField === `email-${member.id}` ? (
                            <CheckIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                          ) : (
                            <DocumentDuplicateIcon className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      {member.mobilePhone && (
                        <div className="flex items-center gap-1">
                          <span>{member.mobilePhone}</span>
                          <button
                            onClick={() => copyToClipboard(member.mobilePhone!, `mobile-${member.id}`)}
                            className="p-1 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                            title="Copy mobile phone to clipboard"
                          >
                            {copiedField === `mobile-${member.id}` ? (
                              <CheckIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                            ) : (
                              <DocumentDuplicateIcon className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No manager assigned</p>
              </div>
            )}
          </div>

          {/* Assistants Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {getRoleIcon('Assistant')}
              <h4 className="font-medium text-gray-900 dark:text-white">
                Assistants ({groupedMembers.Assistant.length})
              </h4>
            </div>
            {groupedMembers.Assistant.length > 0 ? (
              <div className="space-y-2">
                {groupedMembers.Assistant.map((member) => (
                  <div key={member.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {member.firstName} {member.lastName}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(member.roleType)}`}>
                        {member.roleTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <span>{member.email}</span>
                        <button
                          onClick={() => copyToClipboard(member.email, `email-${member.id}`)}
                          className="p-1 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                          title="Copy email to clipboard"
                        >
                          {copiedField === `email-${member.id}` ? (
                            <CheckIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                          ) : (
                            <DocumentDuplicateIcon className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      {member.mobilePhone && (
                        <div className="flex items-center gap-1">
                          <span>{member.mobilePhone}</span>
                          <button
                            onClick={() => copyToClipboard(member.mobilePhone!, `mobile-${member.id}`)}
                            className="p-1 text-secondary hover:text-royal-600 dark:hover:text-royal-400 hover:bg-surface-secondary rounded transition-colors"
                            title="Copy mobile phone to clipboard"
                          >
                            {copiedField === `mobile-${member.id}` ? (
                              <CheckIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                            ) : (
                              <DocumentDuplicateIcon className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No assistants assigned</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default ManagementTeam;
