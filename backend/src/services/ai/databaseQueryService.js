const { sql, getConnection } = require('../../config/database');
const { logger } = require('../../utils/logger');
const Community = require('../../models/community');
const BoardInformation = require('../../models/boardInformation');
const ManagementFee = require('../../models/managementFee');
const Invoice = require('../../models/invoice');

/**
 * Database Query Service for AI
 * Provides database query functions that can be called by Claude via function calling
 * 
 * TODO: Add permission checks once permission system is designed
 * For now: All queries return data (cart blanche for demo)
 */
class DatabaseQueryService {
  /**
   * Get basic community information (public data)
   * @param {string} communityId - Community ID
   * @param {Object} user - User object (for future permission checks)
   * @returns {Promise<Object>} Community information
   */
  async getCommunityInfo(communityId, user = null) {
    try {
      // TODO: Add permission check for 'public' data
      // if (!permissionService.canAccessDataType(user, 'public')) {
      //   return { error: 'insufficient_permissions' };
      // }

      const community = await Community.getById(communityId);
      
      if (!community) {
        return { error: 'community_not_found' };
      }

      // Return only public fields (address, name, etc.)
      return {
        success: true,
        data: {
          communityId: community.CommunityID,
          propertyCode: community.PropertyCode,
          displayName: community.DisplayName,
          legalName: community.LegalName,
          address: community.Address,
          address2: community.Address2,
          city: community.City,
          state: community.State,
          zipcode: community.Zipcode,
          active: community.Active,
          clientType: community.ClientType,
          serviceType: community.ServiceType
        }
      };
    } catch (error) {
      logger.error('Error getting community info', 'DatabaseQueryService', { communityId }, error);
      return { error: 'query_failed', message: error.message };
    }
  }

  /**
   * Get community address (public data)
   * @param {string} communityId - Community ID
   * @param {Object} user - User object
   * @returns {Promise<Object>} Community address
   */
  async getCommunityAddress(communityId, user = null) {
    try {
      // TODO: Add permission check for 'public' data
      const community = await Community.getById(communityId);
      
      if (!community) {
        return { error: 'community_not_found' };
      }

      // Format full address
      const addressParts = [
        community.Address,
        community.Address2,
        community.City,
        community.State,
        community.Zipcode
      ].filter(Boolean);

      return {
        success: true,
        data: {
          communityId: community.CommunityID,
          propertyCode: community.PropertyCode,
          displayName: community.DisplayName,
          fullAddress: addressParts.join(', '),
          address: community.Address,
          address2: community.Address2,
          city: community.City,
          state: community.State,
          zipcode: community.Zipcode
        }
      };
    } catch (error) {
      logger.error('Error getting community address', 'DatabaseQueryService', { communityId }, error);
      return { error: 'query_failed', message: error.message };
    }
  }

  /**
   * Get management fee information (restricted data)
   * @param {string} communityId - Community ID
   * @param {Object} user - User object
   * @returns {Promise<Object>} Management fee information
   */
  async getManagementFees(communityId, user = null) {
    try {
      // TODO: Add permission check for 'restricted' data
      // if (!permissionService.canAccessDataType(user, 'restricted')) {
      //   return { error: 'insufficient_permissions' };
      // }

      const managementFee = await ManagementFee.getByCommunity(communityId);
      
      if (!managementFee) {
        return { error: 'no_management_fee_found' };
      }

      return {
        success: true,
        data: {
          communityId: communityId,
          managementFee: managementFee.ManagementFee,
          perUnitFee: managementFee.PerUnitFee,
          feeType: managementFee.FeeType,
          increaseType: managementFee.IncreaseType,
          increaseEffective: managementFee.IncreaseEffective,
          boardApprovalRequired: managementFee.BoardApprovalRequired,
          autoIncrease: managementFee.AutoIncrease,
          fixedCost: managementFee.FixedCost
        }
      };
    } catch (error) {
      logger.error('Error getting management fees', 'DatabaseQueryService', { communityId }, error);
      return { error: 'query_failed', message: error.message };
    }
  }

  /**
   * Get board member information (sensitive data)
   * 
   * CURRENT IMPLEMENTATION: Board members are stored in cor_Stakeholders with Type='Board Member'
   * FUTURE: When a dedicated cor_BoardMembers table is created, this function should be updated
   * to query that table instead (or as a fallback). The function signature and return format
   * will remain the same for backward compatibility.
   * 
   * @param {string} communityId - Community ID
   * @param {Object} user - User object
   * @returns {Promise<Object>} Board member information
   */
  async getBoardMembers(communityId, user = null) {
    try {
      // TODO: Add permission check for 'sensitive' data
      // if (!permissionService.canAccessDataType(user, 'sensitive')) {
      //   return { error: 'insufficient_permissions' };
      // }

      const pool = await getConnection();
      
      // TODO: When cor_BoardMembers table exists, query that table first
      // For now, get board members from Stakeholders table
      // This query will continue to work even after a dedicated table is added
      const result = await pool.request()
        .input('CommunityID', sql.UniqueIdentifier, communityId)
        .query(`
          SELECT 
            StakeholderID,
            FirstName,
            LastName,
            Email,
            Phone,
            MobilePhone,
            Title,
            SubType,
            Status
          FROM cor_Stakeholders
          WHERE Type = 'Board Member'
            AND CommunityID = @CommunityID
            AND IsActive = 1
          ORDER BY 
            CASE 
              WHEN SubType = 'President' THEN 1
              WHEN SubType = 'Vice President' THEN 2
              WHEN SubType = 'Treasurer' THEN 3
              WHEN SubType = 'Secretary' THEN 4
              ELSE 5
            END,
            LastName, FirstName
        `);

      const boardMembers = result.recordset.map(member => ({
        stakeholderId: member.StakeholderID,
        firstName: member.FirstName,
        lastName: member.LastName,
        fullName: `${member.FirstName || ''} ${member.LastName || ''}`.trim(),
        title: member.Title,
        position: member.SubType, // President, Vice President, etc.
        email: member.Email,
        phone: member.Phone,
        mobilePhone: member.MobilePhone,
        status: member.Status
      }));

      // Also get board information (meeting frequency, etc.)
      const boardInfo = await BoardInformation.getByCommunity(communityId);

      return {
        success: true,
        data: {
          communityId: communityId,
          boardMembers: boardMembers,
          boardInfo: boardInfo ? {
            annualMeetingFrequency: boardInfo.AnnualMeetingFrequency,
            regularMeetingFrequency: boardInfo.RegularMeetingFrequency,
            boardMembersRequired: boardInfo.BoardMembersRequired,
            quorum: boardInfo.Quorum,
            termLimits: boardInfo.TermLimits
          } : null
        }
      };
    } catch (error) {
      logger.error('Error getting board members', 'DatabaseQueryService', { communityId }, error);
      return { error: 'query_failed', message: error.message };
    }
  }

  /**
   * Get billing information (restricted data)
   * @param {string} communityId - Community ID
   * @param {Object} user - User object
   * @returns {Promise<Object>} Billing information
   */
  async getBillingInformation(communityId, user = null) {
    try {
      // TODO: Add permission check for 'restricted' data
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('CommunityID', sql.UniqueIdentifier, communityId)
        .query(`
          SELECT 
            bi.BillingInformationID,
            bi.BillingFrequencyID,
            bi.BillingMonth,
            bi.BillingDay,
            bi.NoticeRequirementID,
            bi.Coupon,
            freq.ChoiceValue AS BillingFrequency,
            notice.ChoiceValue AS NoticeRequirement
          FROM cor_BillingInformation bi
          LEFT JOIN cor_DynamicDropChoices freq 
            ON bi.BillingFrequencyID = freq.ChoiceID 
            AND freq.GroupID = 'billing-frequencies'
            AND freq.IsActive = 1
          LEFT JOIN cor_DynamicDropChoices notice 
            ON bi.NoticeRequirementID = notice.ChoiceID 
            AND notice.GroupID = 'notice-requirements'
            AND notice.IsActive = 1
          WHERE bi.CommunityID = @CommunityID
            AND bi.IsActive = 1
        `);

      if (result.recordset.length === 0) {
        return { error: 'no_billing_information_found' };
      }

      const billingInfo = result.recordset[0];

      return {
        success: true,
        data: {
          communityId: communityId,
          billingFrequency: billingInfo.BillingFrequency,
          billingMonth: billingInfo.BillingMonth,
          billingDay: billingInfo.BillingDay,
          noticeRequirement: billingInfo.NoticeRequirement,
          coupon: billingInfo.Coupon
        }
      };
    } catch (error) {
      logger.error('Error getting billing information', 'DatabaseQueryService', { communityId }, error);
      return { error: 'query_failed', message: error.message };
    }
  }

  /**
   * Get invoices for a community (restricted data)
   * @param {string} communityId - Community ID
   * @param {Object} user - User object
   * @param {Object} options - Optional filters (status, dateRange, limit)
   * @returns {Promise<Object>} Invoice list
   */
  async getInvoices(communityId, user = null, options = {}) {
    try {
      // TODO: Add permission check for 'restricted' data
      const invoices = await Invoice.getByCommunity(communityId);
      
      // Apply optional filters
      let filteredInvoices = invoices;
      
      if (options.status) {
        filteredInvoices = filteredInvoices.filter(inv => 
          inv.Status.toLowerCase() === options.status.toLowerCase()
        );
      }
      
      if (options.limit && options.limit > 0) {
        filteredInvoices = filteredInvoices.slice(0, options.limit);
      }

      return {
        success: true,
        data: {
          communityId: communityId,
          invoices: filteredInvoices.map(inv => ({
            invoiceId: inv.InvoiceID,
            invoiceNumber: inv.InvoiceNumber,
            invoiceDate: inv.InvoiceDate,
            total: inv.Total,
            status: inv.Status,
            fileId: inv.FileID
          })),
          totalCount: invoices.length,
          filteredCount: filteredInvoices.length
        }
      };
    } catch (error) {
      logger.error('Error getting invoices', 'DatabaseQueryService', { communityId }, error);
      return { error: 'query_failed', message: error.message };
    }
  }

  /**
   * Get invoice details with line items (restricted data)
   * @param {string} invoiceId - Invoice ID
   * @param {Object} user - User object
   * @returns {Promise<Object>} Invoice details
   */
  async getInvoiceDetails(invoiceId, user = null) {
    try {
      // TODO: Add permission check for 'restricted' data
      const invoice = await Invoice.getById(invoiceId);
      
      if (!invoice) {
        return { error: 'invoice_not_found' };
      }

      return {
        success: true,
        data: {
          invoiceId: invoice.InvoiceID,
          communityId: invoice.CommunityID,
          invoiceNumber: invoice.InvoiceNumber,
          invoiceDate: invoice.InvoiceDate,
          total: invoice.Total,
          status: invoice.Status,
          fileId: invoice.FileID,
          charges: invoice.Charges ? invoice.Charges.map(charge => ({
            description: charge.Description,
            amount: charge.Amount,
            displayOrder: charge.DisplayOrder
          })) : []
        }
      };
    } catch (error) {
      logger.error('Error getting invoice details', 'DatabaseQueryService', { invoiceId }, error);
      return { error: 'query_failed', message: error.message };
    }
  }

  /**
   * Get complete fee structure for a community (restricted data)
   * Includes: Management fees, fee variances, and commitment fees
   * @param {string} communityId - Community ID
   * @param {Object} user - User object
   * @returns {Promise<Object>} Complete fee structure
   */
  async getFeeStructure(communityId, user = null) {
    try {
      // TODO: Add permission check for 'restricted' data
      const pool = await getConnection();
      
      // Get management fees
      const managementFee = await ManagementFee.getByCommunity(communityId);
      
      // Get fee variances (community-specific fee overrides)
      const variancesResult = await pool.request()
        .input('CommunityID', sql.UniqueIdentifier, communityId)
        .query(`
          SELECT 
            cfv.CommunityFeeVarianceID,
            cfv.FeeMasterID,
            cfv.VarianceType,
            cfv.CustomAmount,
            cfv.Notes,
            fm.FeeName,
            fm.DefaultAmount
          FROM cor_CommunityFeeVariances cfv
          INNER JOIN cor_FeeMaster fm ON cfv.FeeMasterID = fm.FeeMasterID
          WHERE cfv.CommunityID = @CommunityID
            AND cfv.IsActive = 1
            AND fm.IsActive = 1
          ORDER BY fm.DisplayOrder, fm.FeeName
        `);
      
      // Get commitment fees (hybrid fees)
      const commitmentFeesResult = await pool.request()
        .input('CommunityID', sql.UniqueIdentifier, communityId)
        .query(`
          SELECT 
            cf.CommitmentFeeID,
            cf.CommitmentTypeID,
            cf.EntryType,
            cf.FeeName,
            cf.Value,
            cf.Notes,
            ct.ChoiceValue AS CommitmentType
          FROM cor_CommitmentFees cf
          LEFT JOIN cor_DynamicDropChoices ct 
            ON cf.CommitmentTypeID = ct.ChoiceID 
            AND ct.GroupID = 'commitment-types'
            AND ct.IsActive = 1
          WHERE cf.CommunityID = @CommunityID
            AND cf.IsActive = 1
          ORDER BY ct.ChoiceValue, cf.FeeName
        `);

      return {
        success: true,
        data: {
          communityId: communityId,
          managementFee: managementFee ? {
            managementFee: managementFee.ManagementFee,
            perUnitFee: managementFee.PerUnitFee,
            feeType: managementFee.FeeType,
            increaseType: managementFee.IncreaseType,
            increaseEffective: managementFee.IncreaseEffective,
            boardApprovalRequired: managementFee.BoardApprovalRequired,
            autoIncrease: managementFee.AutoIncrease,
            fixedCost: managementFee.FixedCost
          } : null,
          feeVariances: variancesResult.recordset.map(v => ({
            feeName: v.FeeName,
            defaultAmount: v.DefaultAmount,
            varianceType: v.VarianceType,
            customAmount: v.CustomAmount,
            notes: v.Notes
          })),
          commitmentFees: commitmentFeesResult.recordset.map(cf => ({
            commitmentType: cf.CommitmentType,
            entryType: cf.EntryType,
            feeName: cf.FeeName,
            value: cf.Value,
            notes: cf.Notes
          }))
        }
      };
    } catch (error) {
      logger.error('Error getting fee structure', 'DatabaseQueryService', { communityId }, error);
      return { error: 'query_failed', message: error.message };
    }
  }

  /**
   * Get commitment fees for a community (restricted data)
   * @param {string} communityId - Community ID
   * @param {Object} user - User object
   * @returns {Promise<Object>} Commitment fees
   */
  async getCommitmentFees(communityId, user = null) {
    try {
      // TODO: Add permission check for 'restricted' data
      const pool = await getConnection();
      
      const result = await pool.request()
        .input('CommunityID', sql.UniqueIdentifier, communityId)
        .query(`
          SELECT 
            cf.CommitmentFeeID,
            cf.CommitmentTypeID,
            cf.EntryType,
            cf.FeeName,
            cf.Value,
            cf.Notes,
            ct.ChoiceValue AS CommitmentType
          FROM cor_CommitmentFees cf
          LEFT JOIN cor_DynamicDropChoices ct 
            ON cf.CommitmentTypeID = ct.ChoiceID 
            AND ct.GroupID = 'commitment-types'
            AND ct.IsActive = 1
          WHERE cf.CommunityID = @CommunityID
            AND cf.IsActive = 1
          ORDER BY ct.ChoiceValue, cf.FeeName
        `);

      return {
        success: true,
        data: {
          communityId: communityId,
          commitmentFees: result.recordset.map(cf => ({
            commitmentType: cf.CommitmentType,
            entryType: cf.EntryType,
            feeName: cf.FeeName,
            value: cf.Value,
            notes: cf.Notes
          }))
        }
      };
    } catch (error) {
      logger.error('Error getting commitment fees', 'DatabaseQueryService', { communityId }, error);
      return { error: 'query_failed', message: error.message };
    }
  }

  /**
   * Get stakeholders for a community by type (restricted/sensitive data)
   * @param {string} communityId - Community ID
   * @param {string} stakeholderType - Type: 'Resident', 'Staff', 'Vendor', 'Board Member', or null for all
   * @param {Object} user - User object
   * @returns {Promise<Object>} Stakeholder list
   */
  async getStakeholders(communityId, stakeholderType = null, user = null) {
    try {
      // TODO: Add permission check - Board Member is 'sensitive', others are 'restricted'
      const pool = await getConnection();
      
      let query = `
        SELECT 
          StakeholderID,
          Type,
          SubType,
          FirstName,
          LastName,
          CompanyName,
          Email,
          Phone,
          MobilePhone,
          PreferredContactMethod,
          Status,
          Title,
          Department
        FROM cor_Stakeholders
        WHERE CommunityID = @CommunityID
          AND IsActive = 1
      `;
      
      if (stakeholderType) {
        query += ` AND Type = @StakeholderType`;
      }
      
      query += ` ORDER BY Type, LastName, FirstName`;
      
      const request = pool.request()
        .input('CommunityID', sql.UniqueIdentifier, communityId);
      
      if (stakeholderType) {
        request.input('StakeholderType', sql.NVarChar(50), stakeholderType);
      }
      
      const result = await request.query(query);

      return {
        success: true,
        data: {
          communityId: communityId,
          stakeholderType: stakeholderType || 'all',
          stakeholders: result.recordset.map(s => ({
            stakeholderId: s.StakeholderID,
            type: s.Type,
            subType: s.SubType,
            firstName: s.FirstName,
            lastName: s.LastName,
            fullName: `${s.FirstName || ''} ${s.LastName || ''}`.trim() || s.CompanyName,
            companyName: s.CompanyName,
            email: s.Email,
            phone: s.Phone,
            mobilePhone: s.MobilePhone,
            preferredContactMethod: s.PreferredContactMethod,
            status: s.Status,
            title: s.Title,
            department: s.Department
          })),
          count: result.recordset.length
        }
      };
    } catch (error) {
      logger.error('Error getting stakeholders', 'DatabaseQueryService', { communityId, stakeholderType }, error);
      return { error: 'query_failed', message: error.message };
    }
  }

  /**
   * Get contract dates for a community (public data)
   * @param {string} communityId - Community ID
   * @param {Object} user - User object
   * @returns {Promise<Object>} Contract dates
   */
  async getContractDates(communityId, user = null) {
    try {
      // TODO: Add permission check for 'public' data
      const community = await Community.getById(communityId);
      
      if (!community) {
        return { error: 'community_not_found' };
      }

      return {
        success: true,
        data: {
          communityId: communityId,
          propertyCode: community.PropertyCode,
          displayName: community.DisplayName,
          contractStart: community.ContractStart,
          contractEnd: community.ContractEnd,
          isActive: community.Active
        }
      };
    } catch (error) {
      logger.error('Error getting contract dates', 'DatabaseQueryService', { communityId }, error);
      return { error: 'query_failed', message: error.message };
    }
  }

  /**
   * Get financial summary for a community
   * @param {string} communityId - Community ID
   * @param {number} year - Year (optional, defaults to current year)
   * @param {Object} user - User object (for future permission checks)
   * @returns {Promise<Object>} Financial summary with monthly and YTD data
   */
  async getFinancialSummary(communityId, year = null, user = null) {
    try {
      // TODO: Add permission check for 'restricted' data
      const pool = await getConnection();
      const request = pool.request();

      if (!year) {
        year = new Date().getFullYear();
      }

      const result = await request
        .input('CommunityID', sql.UniqueIdentifier, communityId)
        .input('StatementYear', sql.Int, year)
        .query(`
          SELECT 
            StatementMonth,
            StatementDate,
            TotalIncome,
            TotalExpenses,
            NetIncome,
            YTDIncome,
            YTDExpenses,
            YTDNetIncome,
            AssessmentIncome,
            CollectionRate
          FROM cor_FinancialData
          WHERE CommunityID = @CommunityID
            AND StatementYear = @StatementYear
            AND IsActive = 1
          ORDER BY StatementMonth ASC
        `);

      if (result.recordset.length === 0) {
        return {
          success: true,
          data: {
            communityId,
            year,
            message: 'No financial data found for this year',
            months: []
          }
        };
      }

      // Calculate totals and averages
      const months = result.recordset;
      const totalYTDIncome = months.length > 0 ? months[months.length - 1].YTDIncome : 0;
      const totalYTDExpenses = months.length > 0 ? months[months.length - 1].YTDExpenses : 0;
      const totalYTDNetIncome = months.length > 0 ? months[months.length - 1].YTDNetIncome : 0;
      const avgMonthlyIncome = months.reduce((sum, m) => sum + (m.TotalIncome || 0), 0) / months.length;
      const avgMonthlyExpenses = months.reduce((sum, m) => sum + (m.TotalExpenses || 0), 0) / months.length;

      return {
        success: true,
        data: {
          communityId,
          year,
          months: months.map(m => ({
            month: m.StatementMonth,
            date: m.StatementDate,
            income: m.TotalIncome,
            expenses: m.TotalExpenses,
            netIncome: m.NetIncome,
            ytdIncome: m.YTDIncome,
            ytdExpenses: m.YTDExpenses,
            ytdNetIncome: m.YTDNetIncome,
            assessmentIncome: m.AssessmentIncome,
            collectionRate: m.CollectionRate
          })),
          summary: {
            totalYTDIncome,
            totalYTDExpenses,
            totalYTDNetIncome,
            avgMonthlyIncome,
            avgMonthlyExpenses,
            monthsWithData: months.length
          }
        }
      };
    } catch (error) {
      logger.error('Error getting financial summary', 'DatabaseQueryService', { communityId, year }, error);
      return { error: 'query_failed', message: error.message };
    }
  }

  /**
   * Get expense analysis for a community
   * @param {string} communityId - Community ID
   * @param {number} year - Year (optional)
   * @param {string} category - Expense category (optional: 'generalAdmin', 'maintenance', 'reserve')
   * @param {Object} user - User object (for future permission checks)
   * @returns {Promise<Object>} Expense analysis with breakdown by category
   */
  async getExpenseAnalysis(communityId, year = null, category = null, user = null) {
    try {
      // TODO: Add permission check for 'restricted' data
      const pool = await getConnection();
      const request = pool.request();

      if (!year) {
        year = new Date().getFullYear();
      }

      const result = await request
        .input('CommunityID', sql.UniqueIdentifier, communityId)
        .input('StatementYear', sql.Int, year)
        .query(`
          SELECT 
            StatementMonth,
            ExpenseData,
            TotalExpenses,
            YTDExpenses
          FROM cor_FinancialData
          WHERE CommunityID = @CommunityID
            AND StatementYear = @StatementYear
            AND IsActive = 1
          ORDER BY StatementMonth ASC
        `);

      if (result.recordset.length === 0) {
        return {
          success: true,
          data: {
            communityId,
            year,
            message: 'No expense data found for this year',
            expenses: []
          }
        };
      }

      // Parse expense data from JSON
      const expenses = result.recordset.map(r => {
        let expenseData = {};
        try {
          expenseData = JSON.parse(r.ExpenseData || '{}');
        } catch (e) {
          logger.warn('Failed to parse expense data JSON', 'DatabaseQueryService', { month: r.StatementMonth });
        }

        return {
          month: r.StatementMonth,
          totalExpenses: r.TotalExpenses,
          ytdExpenses: r.YTDExpenses,
          generalAdmin: expenseData.generalAdmin || {},
          maintenance: expenseData.maintenance || {},
          reserve: expenseData.reserve || {}
        };
      });

      // Filter by category if specified
      if (category) {
        expenses.forEach(e => {
          e.expenses = e[category] || {};
        });
      }

      // Calculate totals
      const totalYTDExpenses = expenses.length > 0 ? expenses[expenses.length - 1].ytdExpenses : 0;
      const avgMonthlyExpenses = expenses.reduce((sum, e) => sum + (e.totalExpenses || 0), 0) / expenses.length;

      return {
        success: true,
        data: {
          communityId,
          year,
          category: category || 'all',
          expenses,
          summary: {
            totalYTDExpenses,
            avgMonthlyExpenses,
            monthsWithData: expenses.length
          }
        }
      };
    } catch (error) {
      logger.error('Error getting expense analysis', 'DatabaseQueryService', { communityId, year, category }, error);
      return { error: 'query_failed', message: error.message };
    }
  }

  /**
   * Get budget recommendations based on YTD financial data
   * @param {string} communityId - Community ID
   * @param {number} currentYear - Current year (to analyze)
   * @param {number} budgetYear - Year to propose budget for (defaults to currentYear + 1)
   * @param {Object} user - User object (for future permission checks)
   * @returns {Promise<Object>} Budget recommendations with proposed amounts
   */
  async getBudgetRecommendations(communityId, currentYear = null, budgetYear = null, user = null) {
    try {
      // TODO: Add permission check for 'restricted' data
      const pool = await getConnection();
      const request = pool.request();

      if (!currentYear) {
        currentYear = new Date().getFullYear();
      }
      if (!budgetYear) {
        budgetYear = currentYear + 1;
      }

      // Get YTD data for current year
      const result = await request
        .input('CommunityID', sql.UniqueIdentifier, communityId)
        .input('StatementYear', sql.Int, currentYear)
        .query(`
          SELECT 
            StatementMonth,
            ExpenseData,
            YTDExpenses,
            YTDIncome
          FROM cor_FinancialData
          WHERE CommunityID = @CommunityID
            AND StatementYear = @StatementYear
            AND IsActive = 1
          ORDER BY StatementMonth DESC
        `);

      if (result.recordset.length === 0) {
        return {
          success: true,
          data: {
            communityId,
            currentYear,
            budgetYear,
            message: 'No financial data found for analysis',
            recommendations: []
          }
        };
      }

      // Get most recent month's data
      const latestMonth = result.recordset[0];
      const monthsElapsed = latestMonth.StatementMonth;
      const ytdExpenses = latestMonth.YTDExpenses || 0;
      const ytdIncome = latestMonth.YTDIncome || 0;

      // Calculate average monthly expense
      const avgMonthlyExpense = monthsElapsed > 0 ? ytdExpenses / monthsElapsed : 0;
      const projectedAnnualExpense = avgMonthlyExpense * 12;

      // Parse expense categories
      let expenseData = {};
      try {
        expenseData = JSON.parse(latestMonth.ExpenseData || '{}');
      } catch (e) {
        logger.warn('Failed to parse expense data JSON', 'DatabaseQueryService');
      }

      // Calculate recommendations by category
      const recommendations = [];

      // General/Admin expenses
      if (expenseData.generalAdmin) {
        const generalAdminYTD = expenseData.generalAdmin.ytd || 0;
        const avgMonthly = monthsElapsed > 0 ? generalAdminYTD / monthsElapsed : 0;
        const projectedAnnual = avgMonthly * 12;
        const recommended = projectedAnnual * 1.025; // 2.5% increase

        recommendations.push({
          category: 'General/Admin',
          currentYTD: generalAdminYTD,
          avgMonthly,
          projectedAnnual,
          recommendedBudget: recommended,
          increasePercent: 2.5,
          reason: 'Standard year-over-year increase'
        });
      }

      // Maintenance expenses
      if (expenseData.maintenance) {
        const maintenanceYTD = expenseData.maintenance.ytd || 0;
        const avgMonthly = monthsElapsed > 0 ? maintenanceYTD / monthsElapsed : 0;
        const projectedAnnual = avgMonthly * 12;
        const variance = projectedAnnual - (maintenanceYTD * 12 / monthsElapsed); // Compare to current pace
        const recommended = variance > 0.1 * projectedAnnual 
          ? projectedAnnual * 1.02 // 2% buffer if significant variance
          : projectedAnnual * 1.025; // 2.5% increase if stable

        recommendations.push({
          category: 'Maintenance',
          currentYTD: maintenanceYTD,
          avgMonthly,
          projectedAnnual,
          recommendedBudget: recommended,
          increasePercent: ((recommended / projectedAnnual) - 1) * 100,
          reason: variance > 0.1 * projectedAnnual 
            ? 'Significant variance detected, adding buffer'
            : 'Standard year-over-year increase'
        });
      }

      // Reserve expenses
      if (expenseData.reserve) {
        const reserveYTD = expenseData.reserve.ytd || 0;
        const avgMonthly = monthsElapsed > 0 ? reserveYTD / monthsElapsed : 0;
        const projectedAnnual = avgMonthly * 12;
        const recommended = projectedAnnual * 1.03; // 3% increase for reserves

        recommendations.push({
          category: 'Reserve',
          currentYTD: reserveYTD,
          avgMonthly,
          projectedAnnual,
          recommendedBudget: recommended,
          increasePercent: 3.0,
          reason: 'Reserve funds typically need higher increases'
        });
      }

      // Overall recommendation
      const totalRecommended = recommendations.reduce((sum, r) => sum + r.recommendedBudget, 0);
      const totalProjected = recommendations.reduce((sum, r) => sum + r.projectedAnnual, 0);

      return {
        success: true,
        data: {
          communityId,
          currentYear,
          budgetYear,
          monthsElapsed,
          ytdExpenses,
          ytdIncome,
          avgMonthlyExpense,
          projectedAnnualExpense,
          recommendations,
          summary: {
            totalProjectedAnnual: totalProjected,
            totalRecommendedBudget: totalRecommended,
            overallIncreasePercent: ((totalRecommended / totalProjected) - 1) * 100,
            recommendation: totalRecommended > totalProjected * 1.1
              ? 'Significant budget increase needed based on current spending patterns'
              : 'Standard 2-3% increase recommended'
          }
        }
      };
    } catch (error) {
      logger.error('Error getting budget recommendations', 'DatabaseQueryService', { communityId, currentYear }, error);
      return { error: 'query_failed', message: error.message };
    }
  }

  /**
   * Get collection rate for a community
   * @param {string} communityId - Community ID
   * @param {number} year - Year (optional)
   * @param {Object} user - User object (for future permission checks)
   * @returns {Promise<Object>} Collection rate data
   */
  async getCollectionRate(communityId, year = null, user = null) {
    try {
      // TODO: Add permission check for 'restricted' data
      const pool = await getConnection();
      const request = pool.request();

      if (!year) {
        year = new Date().getFullYear();
      }

      const result = await request
        .input('CommunityID', sql.UniqueIdentifier, communityId)
        .input('StatementYear', sql.Int, year)
        .query(`
          SELECT 
            StatementMonth,
            AssessmentIncome,
            CollectionRate,
            IncomeData
          FROM cor_FinancialData
          WHERE CommunityID = @CommunityID
            AND StatementYear = @StatementYear
            AND IsActive = 1
          ORDER BY StatementMonth DESC
        `);

      if (result.recordset.length === 0) {
        return {
          success: true,
          data: {
            communityId,
            year,
            message: 'No collection rate data found for this year',
            collectionRates: []
          }
        };
      }

      const collectionRates = result.recordset.map(r => ({
        month: r.StatementMonth,
        assessmentIncome: r.AssessmentIncome,
        collectionRate: r.CollectionRate,
        collectionRatePercent: r.CollectionRate ? (r.CollectionRate * 100).toFixed(2) : null
      }));

      // Calculate average
      const ratesWithData = collectionRates.filter(r => r.collectionRate !== null);
      const avgCollectionRate = ratesWithData.length > 0
        ? ratesWithData.reduce((sum, r) => sum + r.collectionRate, 0) / ratesWithData.length
        : null;

      return {
        success: true,
        data: {
          communityId,
          year,
          collectionRates,
          summary: {
            avgCollectionRate,
            avgCollectionRatePercent: avgCollectionRate ? (avgCollectionRate * 100).toFixed(2) : null,
            monthsWithData: ratesWithData.length,
            latestCollectionRate: collectionRates[0]?.collectionRatePercent || null
          }
        }
      };
    } catch (error) {
      logger.error('Error getting collection rate', 'DatabaseQueryService', { communityId, year }, error);
      return { error: 'query_failed', message: error.message };
    }
  }
}

module.exports = new DatabaseQueryService();

