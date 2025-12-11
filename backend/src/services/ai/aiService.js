const Anthropic = require('@anthropic-ai/sdk');
const ragService = require('./ragService');
const communityDetectionService = require('./communityDetectionService');
const databaseQueryService = require('./databaseQueryService');
const { logger } = require('../../utils/logger');

/**
 * AI Service - Isolated module for AI functionality
 * Handles all AI interactions with Claude API
 */
class AIService {
  constructor() {
    // Initialize Claude client (only if API key is provided)
    this.client = null;
    this.isEnabled = false;
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (apiKey) {
      // Validate API key format (should start with sk-ant-)
      if (!apiKey.startsWith('sk-ant-')) {
        logger.warn('ANTHROPIC_API_KEY format appears invalid (should start with sk-ant-)', 'AIService');
      }
      
      try {
        this.client = new Anthropic({
          apiKey: apiKey.trim() // Remove any whitespace
        });
        this.isEnabled = true;
        logger.info('AI Service initialized successfully', 'AIService', {
          apiKeyPrefix: apiKey.substring(0, 10) + '...' // Log first 10 chars for debugging
        });
      } catch (error) {
        logger.error('Failed to initialize AI Service', 'AIService', {
          errorMessage: error.message
        }, error);
        this.isEnabled = false;
      }
    } else {
      logger.warn('ANTHROPIC_API_KEY not found in environment variables, AI Service disabled', 'AIService');
    }
  }

  /**
   * Check if AI service is enabled
   */
  isServiceEnabled() {
    return this.isEnabled && this.client !== null;
  }

  /**
   * Get available tools (functions) for Claude to call
   * TODO: Add permission checks once permission system is designed
   */
  getAvailableTools() {
    return [
      {
        name: 'get_community_info',
        description: 'Get basic community information such as name, address, property code, and status. Use this for questions about community details, location, or general information.',
        input_schema: {
          type: 'object',
          properties: {
            communityId: {
              type: 'string',
              description: 'The unique identifier (GUID) of the community'
            }
          },
          required: ['communityId']
        }
      },
      {
        name: 'get_community_address',
        description: 'Get the full address of a community. Use this when the user asks specifically about the address or location.',
        input_schema: {
          type: 'object',
          properties: {
            communityId: {
              type: 'string',
              description: 'The unique identifier (GUID) of the community'
            }
          },
          required: ['communityId']
        }
      },
      {
        name: 'get_management_fees',
        description: 'Get management fee information for a community including fee amount, per-unit fee, fee type, and increase details. Use this for questions about management fees, billing amounts, or fee structures.',
        input_schema: {
          type: 'object',
          properties: {
            communityId: {
              type: 'string',
              description: 'The unique identifier (GUID) of the community'
            }
          },
          required: ['communityId']
        }
      },
      {
        name: 'get_board_members',
        description: 'Get board member information for a community including names, positions (President, Vice President, etc.), contact information, and board meeting details. Use this for questions about board members, board composition, or board leadership.',
        input_schema: {
          type: 'object',
          properties: {
            communityId: {
              type: 'string',
              description: 'The unique identifier (GUID) of the community'
            }
          },
          required: ['communityId']
        }
      },
      {
        name: 'get_billing_information',
        description: 'Get billing information for a community including billing frequency, billing dates, notice requirements, and coupon information. Use this for questions about when bills are sent, billing schedules, or billing processes.',
        input_schema: {
          type: 'object',
          properties: {
            communityId: {
              type: 'string',
              description: 'The unique identifier (GUID) of the community'
            }
          },
          required: ['communityId']
        }
      },
      {
        name: 'get_invoices',
        description: 'Get list of invoices for a community. Use this for questions about invoices, invoice history, invoice status, or recent invoices.',
        input_schema: {
          type: 'object',
          properties: {
            communityId: {
              type: 'string',
              description: 'The unique identifier (GUID) of the community'
            },
            status: {
              type: 'string',
              description: 'Optional: Filter by invoice status (Draft, Sent, Paid, Overdue, Cancelled, Void)',
              enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled', 'Void']
            },
            limit: {
              type: 'number',
              description: 'Optional: Maximum number of invoices to return (default: all)'
            }
          },
          required: ['communityId']
        }
      },
      {
        name: 'get_invoice_details',
        description: 'Get detailed information about a specific invoice including all line items and charges. Use this when the user asks about a specific invoice number or wants to see invoice line items.',
        input_schema: {
          type: 'object',
          properties: {
            invoiceId: {
              type: 'string',
              description: 'The unique identifier (GUID) of the invoice'
            }
          },
          required: ['invoiceId']
        }
      },
      {
        name: 'get_fee_structure',
        description: 'Get complete fee structure for a community including management fees, fee variances (custom fees), and commitment fees (hybrid fees). Use this for questions about all fees, fee breakdown, or comprehensive fee information.',
        input_schema: {
          type: 'object',
          properties: {
            communityId: {
              type: 'string',
              description: 'The unique identifier (GUID) of the community'
            }
          },
          required: ['communityId']
        }
      },
      {
        name: 'get_commitment_fees',
        description: 'Get commitment fees (hybrid fees) for a community. These are fees related to manager compensation, lifestyle fees, and other commitment-based charges. Use this for questions specifically about commitment fees or hybrid fee structures.',
        input_schema: {
          type: 'object',
          properties: {
            communityId: {
              type: 'string',
              description: 'The unique identifier (GUID) of the community'
            }
          },
          required: ['communityId']
        }
      },
      {
        name: 'get_stakeholders',
        description: 'Get stakeholders (residents, staff, vendors, board members) for a community. Use this for questions about people associated with the community. Optionally filter by type.',
        input_schema: {
          type: 'object',
          properties: {
            communityId: {
              type: 'string',
              description: 'The unique identifier (GUID) of the community'
            },
            stakeholderType: {
              type: 'string',
              description: 'Optional: Filter by stakeholder type (Resident, Staff, Vendor, Board Member). Leave empty for all types.',
              enum: ['Resident', 'Staff', 'Vendor', 'Board Member']
            }
          },
          required: ['communityId']
        }
      },
      {
        name: 'get_contract_dates',
        description: 'Get contract start and end dates for a community. Use this for questions about contract duration, contract expiration, or contract timeline.',
        input_schema: {
          type: 'object',
          properties: {
            communityId: {
              type: 'string',
              description: 'The unique identifier (GUID) of the community'
            }
          },
          required: ['communityId']
        }
      },
      {
        name: 'get_financial_summary',
        description: 'Get financial summary for a community including monthly and year-to-date income, expenses, and net income. Use this for questions about financial performance, monthly financials, YTD totals, or financial trends.',
        input_schema: {
          type: 'object',
          properties: {
            communityId: {
              type: 'string',
              description: 'The unique identifier (GUID) of the community'
            },
            year: {
              type: 'number',
              description: 'Optional: Year to get financial data for (defaults to current year)'
            }
          },
          required: ['communityId']
        }
      },
      {
        name: 'get_expense_analysis',
        description: 'Get expense analysis for a community broken down by category (General/Admin, Maintenance, Reserve). Use this for questions about expense categories, expense breakdowns, or spending analysis.',
        input_schema: {
          type: 'object',
          properties: {
            communityId: {
              type: 'string',
              description: 'The unique identifier (GUID) of the community'
            },
            year: {
              type: 'number',
              description: 'Optional: Year to analyze (defaults to current year)'
            },
            category: {
              type: 'string',
              description: 'Optional: Filter by expense category (generalAdmin, maintenance, reserve). Leave empty for all categories.',
              enum: ['generalAdmin', 'maintenance', 'reserve']
            }
          },
          required: ['communityId']
        }
      },
      {
        name: 'get_budget_recommendations',
        description: 'Get budget recommendations for a community based on year-to-date financial data. Analyzes current spending patterns and proposes budget amounts for the next year. Use this for questions about budget planning, budget proposals, or "what should the budget be for next year".',
        input_schema: {
          type: 'object',
          properties: {
            communityId: {
              type: 'string',
              description: 'The unique identifier (GUID) of the community'
            },
            currentYear: {
              type: 'number',
              description: 'Optional: Current year to analyze (defaults to current year)'
            },
            budgetYear: {
              type: 'number',
              description: 'Optional: Year to propose budget for (defaults to currentYear + 1)'
            }
          },
          required: ['communityId']
        }
      },
      {
        name: 'get_collection_rate',
        description: 'Get assessment collection rate for a community. Shows what percentage of assessments billed have been collected. Use this for questions about collection rates, assessment collection, or payment rates.',
        input_schema: {
          type: 'object',
          properties: {
            communityId: {
              type: 'string',
              description: 'The unique identifier (GUID) of the community'
            },
            year: {
              type: 'number',
              description: 'Optional: Year to analyze (defaults to current year)'
            }
          },
          required: ['communityId']
        }
      }
    ];
  }

  /**
   * Check if a query is a simple database query that doesn't need documents
   * @param {string} query - User's question
   * @returns {boolean} True if query can be answered by database alone
   */
  isSimpleDatabaseQuery(query) {
    const lowerQuery = query.toLowerCase();
    const simplePatterns = [
      'what is the address',
      'what\'s the address',
      'address of',
      'where is',
      'location of',
      'what are the management fees',
      'what\'s the management fee',
      'management fee for',
      'what is the ytd',
      'what\'s the ytd',
      'ytd income',
      'ytd expenses',
      'ytd total',
      'year to date',
      'financial summary',
      'collection rate',
      'board members',
      'who are the board',
      'billing information',
      'contract dates',
      'fee structure',
      'commitment fees',
      'stakeholders',
      'invoices',
      'invoice for'
    ];
    
    // If query matches simple patterns, it's likely a database-only query
    return simplePatterns.some(pattern => lowerQuery.includes(pattern));
  }

  /**
   * Execute a function call from Claude
   * @param {string} functionName - Name of the function to call
   * @param {Object} functionArgs - Arguments for the function
   * @param {Object} user - User object (for future permission checks)
   * @returns {Promise<Object>} Function result
   */
  async executeFunction(functionName, functionArgs, user = null) {
    try {
      // Map function names to service methods
      switch (functionName) {
        case 'get_community_info':
          return await databaseQueryService.getCommunityInfo(functionArgs.communityId, user);
        
        case 'get_community_address':
          return await databaseQueryService.getCommunityAddress(functionArgs.communityId, user);
        
        case 'get_management_fees':
          return await databaseQueryService.getManagementFees(functionArgs.communityId, user);
        
        case 'get_board_members':
          return await databaseQueryService.getBoardMembers(functionArgs.communityId, user);
        
        case 'get_billing_information':
          return await databaseQueryService.getBillingInformation(functionArgs.communityId, user);
        
        case 'get_invoices':
          return await databaseQueryService.getInvoices(functionArgs.communityId, user, {
            status: functionArgs.status,
            limit: functionArgs.limit
          });
        
        case 'get_invoice_details':
          return await databaseQueryService.getInvoiceDetails(functionArgs.invoiceId, user);
        
        case 'get_fee_structure':
          return await databaseQueryService.getFeeStructure(functionArgs.communityId, user);
        
        case 'get_commitment_fees':
          return await databaseQueryService.getCommitmentFees(functionArgs.communityId, user);
        
        case 'get_stakeholders':
          return await databaseQueryService.getStakeholders(
            functionArgs.communityId,
            functionArgs.stakeholderType || null,
            user
          );
        
        case 'get_contract_dates':
          return await databaseQueryService.getContractDates(functionArgs.communityId, user);
        
        case 'get_financial_summary':
          return await databaseQueryService.getFinancialSummary(
            functionArgs.communityId,
            functionArgs.year || null,
            user
          );
        
        case 'get_expense_analysis':
          return await databaseQueryService.getExpenseAnalysis(
            functionArgs.communityId,
            functionArgs.year || null,
            functionArgs.category || null,
            user
          );
        
        case 'get_budget_recommendations':
          return await databaseQueryService.getBudgetRecommendations(
            functionArgs.communityId,
            functionArgs.currentYear || null,
            functionArgs.budgetYear || null,
            user
          );
        
        case 'get_collection_rate':
          return await databaseQueryService.getCollectionRate(
            functionArgs.communityId,
            functionArgs.year || null,
            user
          );
        
        default:
          return {
            error: 'unknown_function',
            message: `Unknown function: ${functionName}`
          };
      }
    } catch (error) {
      logger.error('Error executing function', 'AIService', {
        functionName,
        functionArgs,
        error: error.message
      }, error);
      return {
        error: 'execution_failed',
        message: error.message
      };
    }
  }

  /**
   * Basic chat function - sends message to Claude and returns response
   * @param {string} message - User's message
   * @param {Array} conversationHistory - Previous messages in conversation
   * @returns {Promise<Object>} AI response
   */
  async chat(message, conversationHistory = [], options = {}) {
    if (!this.isServiceEnabled()) {
      throw new Error('AI Service is not enabled. Please configure ANTHROPIC_API_KEY.');
    }

    try {
      // Priority: 1. Explicitly selected community (from dropdown), 2. Detection from question
      // If communityId is explicitly provided, use it directly (user selected from dropdown)
      // Otherwise, detect from question text
      let searchCommunityId = null;
      let communityDetection = null;
      let isExplicitSelection = false;

      if (options.communityId) {
        // Explicitly selected from dropdown - use it directly, skip detection
        searchCommunityId = options.communityId;
        isExplicitSelection = true;
        
        logger.info('Using explicitly selected community', 'AIService', {
          communityId: searchCommunityId,
          source: 'dropdown_selection'
        });
      } else {
        // No explicit selection - detect from question text
        // This allows questions like "What is the management fee for Astatica Hills?" 
        // when "General Query" is selected
        communityDetection = await communityDetectionService.detectCommunity(
          message,
          null // No default community when in "General Query" mode
        );

        searchCommunityId = communityDetection.detectedCommunityId;
        
        logger.info('Community detection result', 'AIService', {
          detectedId: searchCommunityId,
          confidence: communityDetection.confidence,
          method: communityDetection.method,
          matchedName: communityDetection.matchedName,
          source: 'detection'
        });
      }

      // Track sources for transparency
      const sources = {
        documents: [], // Files/documents used
        databaseFunctions: [] // Database functions called
      };

      // Check if this is a document-related query and retrieve relevant documents
      // Use RAG if explicitly enabled (default true)
      // This allows searching both Community and Corporate documents
      let documentContext = '';
      const useRAG = options.useRAG !== false; // Default to true
      const isDocumentQuery = ragService.isDocumentQuery(message);
      
      // Extract potential community codes from question (for detection)
      // This helps identify if user is asking about a specific community
      const commonWords = new Set(['THE', 'FOR', 'AND', 'OR', 'BUT', 'WITH', 'FROM', 'THAT', 'THIS', 'WHEN', 'WHERE', 'WHAT', 'WHICH', 'WHO', 'HOW', 'WHY', 'IS', 'ARE', 'WAS', 'WERE', 'BE', 'BEEN', 'HAVE', 'HAS', 'HAD', 'DO', 'DOES', 'DID', 'WILL', 'WOULD', 'COULD', 'SHOULD', 'MAY', 'MIGHT', 'CAN', 'MUST', 'AN', 'A', 'TO', 'OF', 'IN', 'ON', 'AT', 'BY', 'ABOUT']);
      const messageUpper = message.toUpperCase();
      const codePattern = /\b([A-Z]{2,5})\b/g;
      let match;
      const foundCodes = [];
      while ((match = codePattern.exec(messageUpper)) !== null) {
        const code = match[1];
        if (!commonWords.has(code) && code.length >= 2 && code.length <= 5) {
          foundCodes.push(code);
        }
      }
      const extractedCodes = [...new Set(foundCodes)];
      
      // Determine if this is a community-specific question or general question
      // Community-specific: mentions a specific community name/code (only if we used detection)
      const isCommunitySpecific = !isExplicitSelection && 
        (communityDetection?.confidence !== 'none' || extractedCodes.length > 0);
      
      // Check if user is asking about a community that doesn't exist in database
      // Only do this check if we used detection (not explicit selection)
      // Explicit selection means the community exists (it's in the dropdown)
      let detectedCommunityExists = true; // Default to true for explicit selections
      let communityNotFoundMessage = null;
      
      if (!isExplicitSelection && isCommunitySpecific) {
        // Only check existence if we detected the community (not explicitly selected)
        const communities = await communityDetectionService.getAllCommunities();
        detectedCommunityExists = searchCommunityId && 
          communityDetection?.confidence !== 'none' &&
          communities.some(c => c.id === searchCommunityId);
        
        if (!detectedCommunityExists && extractedCodes.length > 0) {
          const detectedCode = extractedCodes[0]; // First detected code
          communityNotFoundMessage = `I couldn't find a community matching "${detectedCode}" in the database. Please verify the community name or code, or select a community from the list.`;
        }
      }
      
      // Use RAG conditionally - only when documents are likely needed
      // Skip RAG for simple database queries (address, basic info, financial summaries)
      // Use RAG for document-specific questions or when database might not have the answer
      const isDocumentSpecificQuery = ragService.isDocumentQuery(message);
      const isSimpleDatabaseQuery = this.isSimpleDatabaseQuery(message);
      
      // Search strategy:
      // 1. Community-specific question + community in database → Search that community's documents ONLY
      // 2. Community-specific question + community NOT in database → Push back, don't search (safety)
      // 3. General question → Search selected community's documents (if selected) or all community documents
      // 4. Corporate files → Only searched if explicitly requested (executive queries) or linked to community in DB
      if (useRAG && (isDocumentSpecificQuery || !isSimpleDatabaseQuery)) {
        try {
          let allRelevantDocs = [];
          
          // If community-specific question but community doesn't exist, don't search
          // We'll add a pushback message to the response instead
          if (communityNotFoundMessage) {
            logger.warn('Community not found in database', 'AIService', {
              detectedCodes: extractedCodes,
              message: message.substring(0, 50)
            });
            // Don't search - we'll return the pushback message
          }
          // Search 1: Community documents (if community detected and exists in database)
          else if (searchCommunityId && detectedCommunityExists) {
            // Community exists in database - search ONLY its documents (priority)
            const communityDocs = await ragService.retrieveRelevantDocuments(message, {
              limit: 5,
              communityId: searchCommunityId,
              folderType: undefined // Don't filter by folderType - get all community docs
            });
            allRelevantDocs.push(...communityDocs);
            
            // Note: Corporate files linked to this community will be found via communityId
            // since they should have CommunityID in the database even if stored in Corporate folder
            
            logger.info('Searched community documents', 'AIService', {
              communityId: searchCommunityId,
              documentsFound: communityDocs.length
            });
          }
          // Search 2: General questions (no specific community mentioned)
          else if (!isCommunitySpecific) {
            // Use selected community as context for general questions
            if (options.communityId) {
              const generalDocs = await ragService.retrieveRelevantDocuments(message, {
                limit: 5,
                communityId: options.communityId,
                folderType: undefined
              });
              allRelevantDocs.push(...generalDocs);
            } else {
              // No community selected - search all community documents (not Corporate)
              const allDocs = await ragService.retrieveRelevantDocuments(message, {
                limit: 5,
                communityId: undefined,
                folderType: 'Community' // Only search Community documents, not Corporate
              });
              allRelevantDocs.push(...allDocs);
            }
          }
          
          // Corporate files are NOT searched here - they should be:
          // 1. Linked to communities in database (found via communityId search above)
          // 2. Or searched explicitly by executives with a special flag (future feature)

          // Remove duplicates (same fileId) and sort by score
          const uniqueDocs = [];
          const seenFileIds = new Set();
          for (const doc of allRelevantDocs) {
            if (!seenFileIds.has(doc.source.fileId)) {
              seenFileIds.add(doc.source.fileId);
              uniqueDocs.push(doc);
            }
          }
          uniqueDocs.sort((a, b) => b.score - a.score);
          const topDocs = uniqueDocs.slice(0, 5); // Get top 5 overall

          if (topDocs.length > 0) {
            documentContext = ragService.formatDocumentsAsContext(topDocs);
            // Track document sources
            sources.documents = topDocs.map(doc => ({
              fileName: doc.source.fileName,
              fileId: doc.source.fileId,
              folderType: doc.source.folderType || 'Community',
              communityId: doc.source.communityId || null
            }));
            logger.info('RAG context retrieved', 'AIService', {
              documentCount: topDocs.length,
              communityDocs: topDocs.filter(d => d.source.communityId).length,
              corporateDocs: topDocs.filter(d => !d.source.communityId && d.source.folderType === 'Corporate').length,
              communityId: searchCommunityId || 'none',
              detectionConfidence: communityDetection.confidence,
              extractedCodes: extractedCodes,
              isDocumentQuery,
              fileNames: topDocs.map(d => d.source.fileName)
            });
          } else {
            logger.warn('No documents found for RAG', 'AIService', {
              communityId: searchCommunityId || 'none',
              detectionConfidence: communityDetection.confidence,
              extractedCodes: extractedCodes,
              message: message.substring(0, 100)
            });
          }
        } catch (ragError) {
          logger.warn('RAG retrieval failed, continuing without document context', 'AIService', {
            error: ragError.message
          });
        }
      }

      // Build messages array with history
      const messages = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // Construct user message with document context if available
      // IMPORTANT: Database queries are PRIMARY source of truth, documents are SUPPORTING
      // CRITICAL: Include community ID so Claude knows what to pass to database functions
      let userMessage = message;
      const communityIdForFunctions = searchCommunityId || options.communityId;
      
      if (communityNotFoundMessage) {
        // If community not found, add pushback message to context
        userMessage = `You are an AI assistant for HOA Nexus, a property management system.

IMPORTANT: The user asked about a community that doesn't exist in the database. You should politely inform them that the community "${extractedCodes[0] || 'mentioned'}" was not found and ask them to verify the community name or select a community from the list.

User Question: ${message}

Please respond by informing the user that the community was not found in the database and they should verify the community name or select a community from the list.`;
      } else if (documentContext) {
        userMessage = `You are an AI assistant for HOA Nexus, a property management system.

**COMMUNITY CONTEXT (IMPORTANT):**
${communityIdForFunctions ? `The user has selected or is asking about a specific community. Use this Community ID for all database function calls: **${communityIdForFunctions}**

When calling database functions (get_management_fees, get_invoices, get_board_members, etc.), ALWAYS use this communityId: "${communityIdForFunctions}"` : `No specific community has been selected. If the user's question is about a specific community, you may need to detect it from the question or ask the user to select a community.`}

**DATA SOURCE PRIORITY (CRITICAL):**
1. **Database queries (via function calls) are the PRIMARY source of truth** - Always use database functions first for structured data (management fees, invoices, board members, etc.)
2. **Documents (PDFs, files) are SUPPORTING/secondary sources** - Use documents to supplement database data, provide context, or answer questions that require document content (e.g., "what does the bylaws say about...")

**HANDLING MULTIPLE DOCUMENTS:**
- If multiple documents contain similar information (e.g., November invoice, December invoice):
  - For historical/specific questions: Use the document that matches the requested time period
  - For current/general questions: Prefer the most recent document (check file names/dates)
  - For conflicting information: Database data takes precedence, mention document discrepancies if relevant
  - When combining info: Clearly state which document each piece of information came from

**EXAMPLES:**
- "What are the management fees?" → Call get_management_fees(communityId: "${communityIdForFunctions || 'COMMUNITY_ID'}") function (database), documents are supplementary
- "Show me the November invoice" → Use get_invoices(communityId: "${communityIdForFunctions || 'COMMUNITY_ID'}") function first, then reference the specific invoice document if needed
- "What does the bylaws say about annual meetings?" → Search documents (no database function for this)
- "Who are the board members?" → Call get_board_members(communityId: "${communityIdForFunctions || 'COMMUNITY_ID'}") function (database), documents are supplementary

**DOCUMENTS PROVIDED:**
${documentContext}

**User Question:** ${message}

**Instructions:**
- For structured data questions (fees, invoices, board members, etc.), ALWAYS call the appropriate database function first
- ${communityIdForFunctions ? `**ALWAYS use communityId: "${communityIdForFunctions}" when calling database functions**` : 'If a community is mentioned, try to detect it or ask the user to select one'}
- Use documents to supplement database data or answer questions that require document content
- If multiple documents are relevant, prioritize by date/relevance to the question
- Database data is authoritative; documents provide context and historical records`;
      } else {
        // No documents, but still provide guidance about database priority
        userMessage = `You are an AI assistant for HOA Nexus, a property management system.

**COMMUNITY CONTEXT (IMPORTANT):**
${communityIdForFunctions ? `The user has selected or is asking about a specific community. Use this Community ID for all database function calls: **${communityIdForFunctions}**

When calling database functions (get_management_fees, get_invoices, get_board_members, etc.), ALWAYS use this communityId: "${communityIdForFunctions}"` : `No specific community has been selected. If the user's question is about a specific community, you may need to detect it from the question or ask the user to select a community.`}

**DATA SOURCE PRIORITY:**
- **Database queries (via function calls) are the PRIMARY source of truth** for structured data
- Always use database functions for questions about: management fees, invoices, board members, billing information, stakeholders, etc.

**User Question:** ${message}

**Instructions:**
- For structured data questions, ALWAYS call the appropriate database function first
- ${communityIdForFunctions ? `**ALWAYS use communityId: "${communityIdForFunctions}" when calling database functions**` : 'If a community is mentioned, try to detect it or ask the user to select one'}
- Please answer the question using database functions when appropriate.`;
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      // Call Claude API with function calling support
      // Model name is configurable via ANTHROPIC_MODEL env variable
      const modelName = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
      
      // Get available tools (database query functions)
      const tools = this.getAvailableTools();
      
      // Get user from options (for future permission checks)
      const user = options.user || null;
      
      // Support function calling with iterative tool use
      let currentMessages = [...messages];
      let finalResponse = null;
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      const maxIterations = 5; // Prevent infinite loops
      let iterations = 0;

      while (iterations < maxIterations) {
        const response = await this.client.messages.create({
          model: modelName,
          max_tokens: 1024,
          messages: currentMessages,
          tools: tools.length > 0 ? tools : undefined
        });

        totalInputTokens += response.usage.input_tokens;
        totalOutputTokens += response.usage.output_tokens;

        // Check if Claude wants to use tools (can be multiple)
        const toolUses = response.content.filter(item => item.type === 'tool_use');
        
        if (toolUses.length > 0) {
          // Claude wants to call one or more functions
          logger.info('Claude requesting function calls', 'AIService', {
            count: toolUses.length,
            functions: toolUses.map(t => t.name)
          });

          // Add Claude's tool use request to conversation
          currentMessages.push({
            role: 'assistant',
            content: response.content
          });

          // Execute all functions in parallel
          const toolResults = await Promise.all(
            toolUses.map(async (toolUse) => {
              // Track database function calls
              sources.databaseFunctions.push({
                functionName: toolUse.name,
                communityId: toolUse.input.communityId || null
              });

              const functionResult = await this.executeFunction(
                toolUse.name,
                toolUse.input,
                user
              );
              
              logger.info('Function executed', 'AIService', {
                functionName: toolUse.name,
                success: !functionResult.error
              });

              return {
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify(functionResult)
              };
            })
          );

          // Add all function results back to conversation
          currentMessages.push({
            role: 'user',
            content: toolResults
          });

          iterations++;
          continue; // Loop back to get Claude's response with the function results
        } else {
          // Claude provided a final text response
          finalResponse = response.content.find(item => item.type === 'text');
          break;
        }
      }

      if (!finalResponse) {
        throw new Error('Max iterations reached or no response generated');
      }

      const aiResponse = finalResponse.text;

      logger.info('AI chat response generated', 'AIService', {
        messageLength: message.length,
        responseLength: aiResponse.length,
        functionCalls: iterations,
        totalInputTokens,
        totalOutputTokens
      });

      // Deduplicate database functions (same function called multiple times)
      const uniqueDatabaseFunctions = [];
      const seenFunctions = new Set();
      for (const func of sources.databaseFunctions) {
        const key = `${func.functionName}-${func.communityId || 'null'}`;
        if (!seenFunctions.has(key)) {
          seenFunctions.add(key);
          uniqueDatabaseFunctions.push(func);
        }
      }

      // Calculate cost (Claude Sonnet 4.5 pricing: $3/1M input, $15/1M output)
      const inputCost = (totalInputTokens / 1_000_000) * 3;
      const outputCost = (totalOutputTokens / 1_000_000) * 15;
      const totalCost = inputCost + outputCost;

      return {
        response: aiResponse,
        model: modelName,
        sources: {
          documents: sources.documents,
          databaseFunctions: uniqueDatabaseFunctions
        },
        usage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          totalTokens: totalInputTokens + totalOutputTokens,
          cost: {
            input: inputCost,
            output: outputCost,
            total: totalCost
          },
          iterations: iterations
        }
      };
    } catch (error) {
      // Log detailed error information
      const errorDetails = {
        message: message.substring(0, 100), // First 100 chars
        errorType: error.constructor.name,
        errorMessage: error.message,
        ...(error.status && { status: error.status }),
        ...(error.statusText && { statusText: error.statusText })
      };
      
      logger.error('Error in AI chat', 'AIService', errorDetails, error);
      
      // Provide more helpful error messages
      if (error.message && error.message.includes('api_key')) {
        throw new Error('Invalid API key. Please check your ANTHROPIC_API_KEY in .env file.');
      } else if (error.message && error.message.includes('401')) {
        throw new Error('Authentication failed. Please verify your API key is correct.');
      } else if (error.message && error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else {
        throw new Error(`AI Service error: ${error.message}`);
      }
    }
  }

  /**
   * Simple test function to verify API connection
   */
  async testConnection() {
    if (!this.isServiceEnabled()) {
      return { success: false, error: 'AI Service not enabled' };
    }

    try {
      const response = await this.chat('Say "Hello, AI service is working!"');
      return { success: true, response: response.response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new AIService();

