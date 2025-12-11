# Claude API Cost Analysis & Optimization

## Current Setup
- **Model**: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
- **Pricing**: $3/1M input tokens, $15/1M output tokens
- **Current Cost**: ~$0.11 for 2 questions (observed)

## Model Pricing Comparison (Anthropic)

### Claude Haiku 3.5
- **Input**: $0.25/1M tokens
- **Output**: $1.25/1M tokens
- **Speed**: Fastest
- **Capability**: Good for simple queries, less capable for complex reasoning
- **Cost Savings**: ~92% cheaper on input, ~92% cheaper on output
- **Best For**: Simple Q&A, basic document queries, high-volume low-complexity tasks

### Claude Sonnet 3.5
- **Input**: $3/1M tokens
- **Output**: $15/1M tokens
- **Speed**: Fast
- **Capability**: Strong balance of capability and cost
- **Cost Savings**: Same as Sonnet 4.5
- **Best For**: General purpose, good balance

### Claude Sonnet 4.5 (Current)
- **Input**: $3/1M tokens
- **Output**: $15/1M tokens
- **Speed**: Fast
- **Capability**: Most capable Sonnet model
- **Best For**: Complex reasoning, financial analysis, multi-step queries

### Claude Opus 4
- **Input**: $15/1M tokens
- **Output**: $75/1M tokens
- **Speed**: Slower
- **Capability**: Most capable, best reasoning
- **Cost**: 5x more expensive than Sonnet
- **Best For**: Most complex tasks, when accuracy is critical

## Cost Breakdown Analysis

### What Drives High Costs:

1. **System Prompt** (~1,500 tokens)
   - Instructions about database priority
   - Document handling rules
   - Community context
   - Examples

2. **Function Definitions** (~3,500 tokens)
   - 16 database query functions
   - Full schemas and descriptions
   - Sent with every request

3. **Document Context (RAG)** (~2,000-5,000 tokens)
   - Up to 5 documents
   - Full text chunks (~400 tokens each)
   - Metadata headers

4. **Function Call Results** (~500-2,000 tokens per call)
   - Database query responses (JSON)
   - Financial data can be large (10 months × multiple fields)

5. **Conversation History** (~200-1,000 tokens)
   - Last 10 messages
   - Context for follow-up questions

6. **Iterative Tool Use**
   - Multiple function calls in one query
   - Each iteration adds tokens

### Estimated Token Usage Per Query:

**Simple Query (no RAG, no functions):**
- System prompt: 1,500
- User message: 50
- Response: 200
- **Total**: ~1,750 tokens = **$0.005**

**Financial Query (with RAG + function calls):**
- System prompt: 1,500
- Function definitions: 3,500
- Document context: 3,000
- User message: 50
- Function call result: 1,500
- Response: 800
- **Total**: ~10,350 tokens = **$0.031 + $0.012 = $0.043**

**Complex Query (multiple functions, large docs):**
- System prompt: 1,500
- Function definitions: 3,500
- Document context: 5,000
- User message: 100
- Function call results: 4,000 (multiple calls)
- Response: 1,200
- **Total**: ~15,300 tokens = **$0.046 + $0.018 = $0.064**

## Optimization Strategies

### 1. Model Selection
- **Haiku 3.5**: Use for simple queries (address, basic info)
- **Sonnet 4.5**: Keep for complex queries (financial analysis, budgeting)
- **Hybrid Approach**: Route queries based on complexity

### 2. Reduce Function Definitions
- Only send functions that might be needed
- Group related functions
- Shorten descriptions

### 3. Optimize Document Context
- Limit to top 3 documents (instead of 5)
- Truncate chunks to 200 tokens (instead of 400)
- Only include if relevance score > 0.7

### 4. Optimize System Prompt
- Remove redundant instructions
- Make more concise
- Use shorter examples

### 5. Cache Function Results
- Cache database queries for 5-10 minutes
- Avoid re-querying same data
- Especially useful for financial summaries

### 6. Reduce Conversation History
- Limit to last 5 messages (instead of 10)
- Only include if truly needed for context

## Development Partner Program

Anthropic offers a **Development Partner Program** that provides:
- **30% discount** on Claude Code input tokens (Sonnet 3.5, 3.7, 4)
- **6% discount** on Claude Code input tokens (Opus 4, 4.1)
- **Trade-off**: Share usage data with Anthropic for model improvement

**Note**: This is specifically for "Claude Code" (coding tasks), not general chat. However, there may be other programs for general usage.

## Cost Tracking Implementation

We've added cost tracking that displays:
- Total tokens (input/output breakdown)
- Cost breakdown (input/output/total)
- Number of iterations (function calls)
- Model used

This appears under the "Sources" section in the AI chat UI.

## Recommendations

1. **Keep Sonnet 4.5** for now - it's the right balance for your use case
2. **Monitor costs** with the new tracking to identify expensive queries
3. **Consider Haiku** for simple queries if you implement query routing
4. **Optimize document context** - this is likely the biggest win
5. **Cache function results** - financial data doesn't change frequently
6. **Join Development Partner Program** if available for general usage (check Anthropic console)

## Expected Monthly Costs

**Conservative Estimate** (100 users, 20-30 heavy users):
- Heavy users: 30 users × 50 queries/month = 1,500 queries
- Regular users: 70 users × 10 queries/month = 700 queries
- **Total**: 2,200 queries/month

**Average cost per query**: $0.05 (based on financial queries)
- **Monthly cost**: 2,200 × $0.05 = **$110/month**

**With optimizations** (reduce document context, cache results):
- **Average cost per query**: $0.03
- **Monthly cost**: 2,200 × $0.03 = **$66/month**

**Upper limit** ($5k/month):
- At $0.05/query: 100,000 queries/month
- At $0.03/query: 166,000 queries/month

## Next Steps

1. ✅ Add cost tracking (completed)
2. Monitor costs for 1 week to identify patterns
3. Implement document context optimization
4. Consider caching for financial queries
5. Evaluate Haiku for simple queries
6. Check Anthropic console for partner programs

