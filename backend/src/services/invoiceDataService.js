const ManagementFee = require('../models/managementFee');
const FeeMaster = require('../models/feeMaster');
const CommunityFeeVariance = require('../models/communityFeeVariance');
const CommitmentFees = require('../models/commitmentFees');
const { logger } = require('../utils/logger');

/**
 * Service to gather all fee data for a community to generate an invoice
 */
class InvoiceDataService {
  /**
   * Get all fees for a community (Management, Standard with variances, Commitments)
   * @param {string} communityId - Community ID
   * @returns {Promise<Object>} Object with all fee data
   */
  static async getAllFeesForCommunity(communityId) {
    try {
      // Get all fee data in parallel
      const [managementFees, feeMasters, variances, commitmentFees] = await Promise.all([
        ManagementFee.getByCommunity(communityId),
        FeeMaster.getAll(),
        CommunityFeeVariance.getByCommunity(communityId),
        CommitmentFees.getByCommunity(communityId)
      ]);

      // Process standard fees with variances
      const standardFees = feeMasters
        .filter(fee => fee.IsActive)
        .map(fee => {
          // Find variance for this fee
          const variance = variances.find(v => 
            v.FeeMasterID === fee.FeeMasterID && v.IsActive
          );

          let amount = fee.DefaultAmount;
          let description = fee.FeeName;
          let shouldInclude = true;

          if (variance) {
            if (variance.VarianceType === 'Not Billed') {
              shouldInclude = false;
            } else if (variance.VarianceType === 'Custom') {
              amount = variance.CustomAmount;
              if (variance.Notes) {
                description = `${fee.FeeName} (${variance.Notes})`;
              }
            }
            // 'Standard' uses default amount
          }

          return {
            type: 'standard',
            feeMasterId: fee.FeeMasterID,
            description,
            amount,
            displayOrder: fee.DisplayOrder,
            shouldInclude
          };
        })
        .filter(fee => fee.shouldInclude)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      // Process management fees (returns single object or null)
      const managementFeeCharges = [];
      if (managementFees && managementFees.IsActive && managementFees.ManagementFee) {
        managementFeeCharges.push({
          type: 'management',
          description: 'Management Fee',
          amount: managementFees.ManagementFee,
          displayOrder: 0
        });
      }

      // Process commitment fees (grouped by commitment type)
      const commitmentCharges = [];
      const commitmentGroups = {};

      commitmentFees
        .filter(fee => fee.IsActive)
        .forEach(fee => {
          const typeId = fee.CommitmentTypeID;
          if (!commitmentGroups[typeId]) {
            commitmentGroups[typeId] = {
              typeName: fee.CommitmentTypeName || 'Commitment',
              fees: []
            };
          }
          commitmentGroups[typeId].fees.push(fee);
        });

      // Convert commitment groups to charges
      Object.values(commitmentGroups).forEach(group => {
        group.fees.forEach(fee => {
          if (fee.EntryType === 'Compensation' && fee.Value !== null) {
            commitmentCharges.push({
              type: 'commitment',
              description: `${group.typeName} - ${fee.FeeName}`,
              amount: fee.Value,
              displayOrder: 1000 + commitmentCharges.length
            });
          } else if (fee.EntryType === 'Commitment') {
            // Commitments don't have monetary value, but we can include them as $0 or skip
            // For now, skip them as they're not billable
          }
        });
      });

      // Combine all charges
      const allCharges = [
        ...managementFeeCharges,
        ...standardFees.map(fee => ({
          type: fee.type,
          description: fee.description,
          amount: fee.amount,
          displayOrder: fee.displayOrder
        })),
        ...commitmentCharges
      ].sort((a, b) => a.displayOrder - b.displayOrder);

      // Calculate total
      const total = allCharges.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0);

      return {
        managementFees: managementFeeCharges,
        standardFees,
        commitmentFees: commitmentCharges,
        allCharges,
        total
      };
    } catch (error) {
      logger.error('Error gathering fee data for invoice', 'InvoiceDataService', { communityId }, error);
      throw error;
    }
  }
}

module.exports = InvoiceDataService;

