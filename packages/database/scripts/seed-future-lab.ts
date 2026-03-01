/**
 * Seed script for Future-Ready Lab tracks, labs, and the first weekly challenge.
 * Run: npx ts-node scripts/seed-future-lab.ts  (from packages/database)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TRACKS = [
    {
        slug: 'ai-agents',
        title: 'AI Agents & Prompt Engineering',
        description: 'Build autonomous AI workflows using modern agent patterns and prompt engineering.',
        icon: 'Bot',
        gradient: 'from-orange-500 to-red-500',
        cardBg: 'bg-orange-50 dark:bg-gray-800/80',
        border: 'border-orange-200 dark:border-orange-500/30',
        tag: '🔥 Hottest Skill',
        tagColor: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300',
        totalMinutes: 90,
        order: 1,
        labs: [
            {
                title: 'Understanding AI Agents & ReAct Pattern',
                duration: '20 min', durationMin: 20, isFree: true, order: 1,
                content: `# Lab 1 — Understanding AI Agents & the ReAct Pattern

## What is an AI Agent?

A traditional LLM chatbot answers one question at a time. You ask → it answers. Done.

An **AI Agent** is fundamentally different. It can:
- Decide *what action to take* based on a goal
- Call external tools (search, code execution, APIs)
- Observe the result and decide what to do *next*
- Repeat this loop until the goal is achieved

Think of it this way: a chatbot is a one-shot rocket. An agent is a guided missile that continuously corrects its trajectory.

---

## The ReAct Pattern (Reasoning + Acting)

ReAct, introduced by Google in 2022, is the foundational pattern behind most modern agents. The idea is simple: interleave **reasoning** (thought) with **acting** (tool calls), so the model can plan step by step.

The loop looks like this:

Thought → Action → Observation → Thought → Action → Observation → ... → Final Answer

### Example: "What is the current stock price of Apple?"

> **Thought:** The user wants Apple's current stock price. I need to look this up in real time because my training data is outdated.
> 
> **Action:** search_web("Apple AAPL stock price today")
> 
> **Observation:** AAPL is trading at $189.50 as of 2 minutes ago.
> 
> **Thought:** I now have the current price. I can answer the user.
> 
> **Final Answer:** Apple (AAPL) is currently trading at $189.50.

Without the tool call, the model would have guessed — or worse, hallucinated a plausible but wrong number.

---

## Why ReAct Works So Well

Before ReAct, researchers tried two separate approaches:
- **Chain-of-Thought (CoT):** Ask the model to reason step-by-step. Improved accuracy for math/logic but couldn't access real-world info.
- **Tool-use only:** Let the model call APIs but without explicit reasoning. Led to random, inefficient tool calls.

ReAct combines both. The explicit "Thought" step forces the model to plan before acting, dramatically reducing unnecessary tool calls and hallucinations.

---

## Anatomy of an Agent Loop

Here is a simplified Python implementation of the core agent loop:

\`\`\`python
import openai
import json

def run_agent(user_query: str, tools: list, max_steps: int = 10):
    messages = [
        {"role": "system", "content": "You are a helpful agent. Think step by step before acting."},
        {"role": "user", "content": user_query}
    ]
    
    for step in range(max_steps):
        # 1. Ask the LLM what to do next
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=tools,        # <-- Tool definitions (JSON schemas)
            tool_choice="auto"  # Let the model decide when to call tools
        )
        
        msg = response.choices[0].message
        
        # 2. If the model chose to call a tool...
        if msg.tool_calls:
            messages.append(msg)  # Add model's response to history
            
            for tool_call in msg.tool_calls:
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments)
                
                # 3. Execute the tool (Observation)
                result = execute_tool(tool_name, tool_args)
                
                # 4. Feed the result back to the model
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": str(result)
                })
        else:
            # 5. Model is done — return the final answer
            return msg.content
    
    return "Max steps reached."
\`\`\`

---

## Key Concepts to Understand

### Context Window as Working Memory
An agent's "brain" is its context window. Every thought, action, and observation gets appended to the message history. This is why context length matters so much for agentic applications — a complex task may require dozens of rounds of tool use.

### Stopping Conditions
A naive agent loop can run forever. In production, you always set:
- **Max steps:** Hard limit on the number of iterations (e.g., 10–25 steps)
- **Confidence threshold:** Stop when the model says it's done (no more tool calls)
- **Timeout:** Wall-clock time limit for the entire run

### Determinism vs. Temperature
Agents typically use **temperature = 0** or very low values (0.1–0.2). High temperatures introduce randomness that can cause unpredictable tool call sequences. Save high temperature for creative tasks, not agentic workflows.

---

## Common Agent Failure Modes

| Failure | Cause | Fix |
| --- | --- | --- |
| **Infinite loops** | Model keeps calling the same tool | Add step counter + detect repeated actions |
| **Hallucinated tool calls** | Model invents arguments that don't match the schema | Use strict JSON schema validation |
| **Context overflow** | Too many steps fill the context window | Summarize old steps before appending new ones |
| **Action paralysis** | Model overthinks and never acts | Use structured prompting: "If uncertain, search first" |

---

## Exercise: Trace a ReAct Loop

Read the following scenario and fill in the blank Thought/Action/Observation steps:

**User Query:** "Is it cheaper to fly from Delhi to Mumbai or take the train?"

Step 1:
> Thought: _______________________________________________
> Action: search_web("_______________________________________________")
> Observation: Flight price ~₹3,500 (1h 50m)

Step 2:
> Thought: _______________________________________________
> Action: search_web("_______________________________________________")
> Observation: Train price ~₹800 (16h, Rajdhani Express)

Step 3:
> Thought: _______________________________________________
> Final Answer: _______________________________________________

After completing this exercise, you'll have a solid intuition for how an agent reasons through a multi-step problem.

---

## Key Takeaways

- An AI Agent = LLM + Tools + a Loop
- ReAct interleaves Thought (reasoning) and Action (tool calls) to ground the model in reality
- The context window is the agent's working memory — manage it carefully
- Always set stopping conditions to prevent runaway agents
- Low temperature = more predictable, reliable agent behavior

---

## What's Next
In Lab 2, you'll go from theory to code — you'll define real tools as JSON schemas and wire them into an OpenAI API call to build your first working tool-calling agent.`
            },
            {
                title: 'Building Your First Tool-Calling Agent',
                duration: '25 min', durationMin: 25, isFree: true, order: 2,
                content: `# Lab 2 — Building Your First Tool-Calling Agent

## Prerequisites
- Completed Lab 1 (ReAct Pattern)
- An OpenAI API key (or Groq/Anthropic — the pattern is identical)
- Python 3.9+ or Node.js 18+

---

## What You'll Build

A functional agent that can answer questions about the current date, do web searches, and run basic calculations — all orchestrated by an LLM. By the end, you'll have a fully working agent loop you can extend into any application.

---

## Step 1: Define Your Tools as JSON Schemas

OpenAI (and most modern LLM providers) use the **JSON Schema** standard to describe tools. This is how you tell the model what tools exist, what they do, and what arguments they expect.

\`\`\`python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_date",
            "description": "Returns today's date and day of the week. Use this when the user asks about the current date or time.",
            "parameters": {
                "type": "object",
                "properties": {},  # No arguments needed
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Search the internet for current information. Use this for news, prices, events, or any information that may be recent.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query. Be specific for better results."
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": "Evaluate a mathematical expression. Use for arithmetic, percentages, and unit conversions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "A valid Python math expression, e.g. '(150 * 1.18) / 12'"
                    }
                },
                "required": ["expression"]
            }
        }
    }
]
\`\`\`

**Key insight:** The description field is crucial. The model uses it to decide *when* to call the tool. Write it like documentation for a human reviewer — be explicit about when to use it and when NOT to.

---

## Step 2: Implement the Tool Executor

This is the "glue" code. When the model decides to call a tool, your code runs it and collects the observation.

\`\`\`python
import datetime
import math

def execute_tool(name: str, args: dict) -> str:
    if name == "get_current_date":
        now = datetime.datetime.now()
        return f"Today is {now.strftime('%A, %B %d, %Y')}."
    
    elif name == "search_web":
        # In production: use SerpAPI, Brave Search API, or Tavily
        # For this demo, we simulate a result
        query = args["query"]
        return f"[Simulated search for '{query}']: Found 5 results. Top result: Example relevant content about {query}."
    
    elif name == "calculate":
        expr = args["expression"]
        try:
            # SECURITY NOTE: Never use eval() on untrusted input in production!
            # Use a safe math library like simpleeval or numexpr instead.
            result = eval(expr, {"__builtins__": {}}, {"math": math})
            return f"Result: {result}"
        except Exception as e:
            return f"Error evaluating expression: {str(e)}"
    
    else:
        return f"Unknown tool: {name}"
\`\`\`

---

## Step 3: Build the Full Agent Loop

\`\`\`python
import openai
import json

client = openai.OpenAI(api_key="YOUR_API_KEY")

def run_agent(user_query: str) -> str:
    print(f"\\n🤖 Agent started for: '{user_query}'\\n")
    
    messages = [
        {
            "role": "system",
            "content": (
                "You are a helpful assistant with access to tools. "
                "Always think carefully about which tool to use. "
                "Use get_current_date before answering questions about today's date. "
                "Use search_web for any information that could be outdated. "
                "Use calculate for any math operations instead of computing mentally."
            )
        },
        {"role": "user", "content": user_query}
    ]
    
    max_steps = 8
    
    for step in range(max_steps):
        print(f"  Step {step + 1}...")
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=tools,
            tool_choice="auto",
            temperature=0.1  # Low temperature for reliable tool use
        )
        
        msg = response.choices[0].message
        finish_reason = response.choices[0].finish_reason
        
        # If the model is done (no tool calls), return the answer
        if finish_reason == "stop" or not msg.tool_calls:
            print(f"\\n✅ Final Answer: {msg.content}")
            return msg.content
        
        # Add model's tool call decision to history
        messages.append(msg)
        
        # Execute each tool call
        for tool_call in msg.tool_calls:
            name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)
            
            print(f"  🔧 Calling tool: {name}({args})")
            observation = execute_tool(name, args)
            print(f"  👁️  Observation: {observation}")
            
            # Feed observation back to the model
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": observation
            })
    
    return "Agent reached max steps without a final answer."

# Test it!
result = run_agent("What is 15% of ₹45,000 and what day of the week is it today?")
\`\`\`

---

## Step 4: Understanding Tool Call Responses

When you call the API and the model wants to use a tool, the response looks like this:

\`\`\`json
{
  "id": "chatcmpl-abc123",
  "choices": [{
    "finish_reason": "tool_calls",
    "message": {
      "role": "assistant",
      "content": null,
      "tool_calls": [
        {
          "id": "call_xyz789",
          "type": "function",
          "function": {
            "name": "calculate",
            "arguments": "{\\"expression\\": \\"45000 * 0.15\\"}"
          }
        }
      ]
    }
  }]
}
\`\`\`

Notice:
- \`finish_reason\` is \`"tool_calls"\` (not \`"stop"\`) — this tells you more steps are needed
- \`content\` is \`null\` — the model hasn't given a final answer yet
- The \`arguments\` field is a **JSON string**, not an object — you must \`json.loads()\` it

---

## Step 5: Parallel Tool Calls (Coming in GPT-4o)

Modern models can call multiple tools in a single step:

\`\`\`json
"tool_calls": [
  { "id": "call_1", "function": {"name": "get_current_date", "arguments": "{}"}},
  { "id": "call_2", "function": {"name": "calculate", "arguments": "{\\"expression\\": \\"45000 * 0.15\\"}"}}
]
\`\`\`

Your executor code must handle both responses before continuing the loop. This can dramatically speed up agents that need several pieces of information simultaneously.

---

## Production Best Practices

- **Validate all tool inputs** against the expected schema before executing
- **Log every step** — debugging agent failures requires full traces
- **Time out individual tool calls** — don't let one slow API call hang your entire agent
- **Return structured data from tools** in a consistent format (JSON or markdown tables)
- **Never expose sensitive credentials or data** in tool results that will be appended to the context

---

## Exercise: Add a New Tool

Extend the agent above with a \`get_weather\` tool that returns (simulated) weather data:

\`\`\`python
# Your task: define the JSON schema for this tool
# and implement execute_tool("get_weather", {"city": "Mumbai"})
# Expected output: "Mumbai: 32°C, Partly Cloudy, Humidity 78%"
\`\`\`

Test it by querying: "What should I wear if I have an outdoor meeting in Mumbai today?"

---

## Key Takeaways
- Tools are defined as JSON schemas — the description is what the model reads to decide when to call them
- The agent loop is: LLM response → tool call? → execute → append observation → repeat
- Always check \`finish_reason\` to know if the model needs more steps or is done
- Log everything. Agent debugging is about understanding the reasoning trace, not just the final output`
            },
            {
                title: 'Multi-Step Reasoning & Chain-of-Thought',
                duration: '25 min', durationMin: 25, isFree: false, order: 3,
                content: `# Lab 3 — Multi-Step Reasoning & Chain-of-Thought Prompting

## Why Standard Prompting Fails for Hard Problems

Ask GPT-4: "A bat and ball cost ₹110. The bat costs ₹100 more than the ball. How much does the ball cost?"

Without special prompting, many models say ₹10 — which is wrong (the correct answer is ₹5). This is the classic CRT (Cognitive Reflection Test) problem, and it exposes a key LLM weakness: **fast, pattern-matching answers that skip actual reasoning**.

Chain-of-Thought (CoT) prompting forces the model to reason through problems step by step, dramatically improving accuracy on math, logic, and multi-step agentic tasks.

---

## 1. Zero-Shot Chain-of-Thought

The simplest technique: just add **"Let's think step by step."** to your prompt.

\`\`\`python
# WITHOUT CoT (often wrong on tricky problems)
prompt_basic = """A bat and ball cost ₹110. The bat costs ₹100 more than the ball. 
How much does the ball cost?"""

# WITH Zero-Shot CoT
prompt_cot = """A bat and ball cost ₹110. The bat costs ₹100 more than the ball. 
How much does the ball cost?

Let's think step by step."""
\`\`\`

**Why it works:** The phrase "step by step" activates slower, more deliberate reasoning paths in the model rather than immediate pattern completion. The model was trained on human reasoning traces, and this phrase primes it to reproduce that pattern.

**Expected Output with CoT:**
> Let's think step by step.
> Let the ball cost X rupees.
> Then the bat costs X + 100.
> Together: X + (X + 100) = 110
> 2X + 100 = 110
> 2X = 10
> X = 5
> The ball costs ₹5.

---

## 2. Few-Shot Chain-of-Thought

Provide 2–3 worked examples (shots) before your actual problem. This teaches the model the reasoning *format* you want.

\`\`\`python
few_shot_cot_prompt = """Solve these word problems by showing your full working.

Problem: There are 5 boxes. Each box has 8 apples. 3 apples from each box are removed. 
How many apples are left in total?
Reasoning: 
- Start: 5 × 8 = 40 apples
- Removed: 5 × 3 = 15 apples  
- Remaining: 40 - 15 = 25 apples
Answer: 25 apples

Problem: A train travels at 80 km/h. It departs at 9:00 AM and arrives at 12:30 PM.
How far did it travel?
Reasoning:
- Duration: 12:30 PM - 9:00 AM = 3.5 hours
- Distance = Speed × Time = 80 × 3.5 = 280 km
Answer: 280 km

Problem: {YOUR_PROBLEM_HERE}
Reasoning:
"""
\`\`\`

**When to use Few-Shot vs Zero-Shot:**
- Zero-Shot: Quick, cheaper, sufficient for most straightforward problems
- Few-Shot: More reliable for domain-specific formats, specialized outputs, or unusual reasoning styles

---

## 3. Structured Reasoning Prompts for Agents

For agents, you want the model's reasoning to follow a predictable structure so you can parse it programmatically.

\`\`\`python
AGENT_SYSTEM_PROMPT = """You are a highly capable reasoning agent. For every task, follow this exact format:

GOAL: [Restate the user's goal in your own words]
PLAN: [List 3-5 concrete steps you will take]
STEP 1: [Take the first action]
OBSERVATION: [What did you learn?]
STEP 2: [Take the next action based on what you observed]
OBSERVATION: [What did you learn?]
...
CONCLUSION: [Synthesize all observations into a final answer]

Always show your full reasoning. Never skip steps."""
\`\`\`

This structured format makes agent outputs auditable, debuggable, and much easier to evaluate.

---

## 4. Self-Consistency Sampling

A powerful technique for high-stakes decisions: run the same prompt **multiple times**, then take the majority vote.

\`\`\`python
import openai
from collections import Counter

client = openai.OpenAI(api_key="YOUR_KEY")

def self_consistent_answer(problem: str, n_samples: int = 5) -> str:
    """Run the same problem multiple times and return the majority answer."""
    
    answers = []
    
    for i in range(n_samples):
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Solve the problem step by step, then give a final numeric answer on the last line prefixed with 'Answer:'"},
                {"role": "user", "content": problem}
            ],
            temperature=0.7  # Higher temperature to get diverse reasoning paths
        )
        
        text = response.choices[0].message.content
        
        # Extract just the final answer line
        for line in text.split("\\n"):
            if line.startswith("Answer:"):
                answers.append(line.replace("Answer:", "").strip())
                break
    
    print(f"All answers sampled: {answers}")
    
    # Majority vote
    vote_counts = Counter(answers)
    winner, votes = vote_counts.most_common(1)[0]
    print(f"Majority answer: {winner} ({votes}/{n_samples} votes)")
    return winner

# Test: A problem where models sometimes make mistakes
result = self_consistent_answer(
    "A store has a 20% off sale. An item originally costs ₹2,500. "
    "You also have a loyalty coupon for an additional 10% off the sale price. "
    "What is the final price?"
)
\`\`\`

**When to use Self-Consistency:**
- When errors are very costly (medical, financial, legal domains)
- When you're using a smaller/cheaper model and need higher accuracy
- When model accuracy on similar problems is below 85%

**Trade-off:** 5x more API calls = 5x more cost and latency. Use for critical paths only.

---

## 5. Tree-of-Thought (ToT)

The most powerful (and expensive) technique. Instead of one reasoning path, explore *multiple branches* simultaneously and select the best.

\`\`\`python
def tree_of_thought(problem: str) -> str:
    """
    Simplified Tree-of-Thought:
    1. Generate 3 different approaches
    2. Evaluate each approach
    3. Continue only with the most promising one
    """
    
    # Phase 1: Generate 3 different solving strategies
    strategies_response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": f"""Problem: {problem}
            
Generate 3 different high-level strategies to solve this. 
Format: 
Strategy A: [1 sentence description]
Strategy B: [1 sentence description]  
Strategy C: [1 sentence description]"""
        }],
        temperature=0.8
    )
    strategies_text = strategies_response.choices[0].message.content
    print("Strategies generated:", strategies_text)
    
    # Phase 2: Evaluate which strategy is most promising
    eval_response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": f"""Problem: {problem}

Available strategies:
{strategies_text}

Which strategy is most likely to lead to the correct answer and why? 
Answer with: "Best strategy: [A/B/C] because [reason]"
Then execute that strategy fully."""
        }],
        temperature=0.1  # Low temperature for final execution
    )
    
    return eval_response.choices[0].message.content

\`\`\`

**ToT shines for:** Creative tasks, complex planning, multi-objective optimization, and problems where the right approach isn't obvious upfront.

---

## 6. Applying CoT to Agent Planning

In a real agent system, you can use structured CoT to generate a plan *before* taking actions:

\`\`\`python
PLANNING_PROMPT = """Before taking any actions, create a precise plan.

User Goal: {goal}

Your plan:
1. What information do I already have?
2. What information do I need to gather?
3. What are the exact steps, in order?
4. What is my stopping condition?

Plan:"""

def plan_then_execute(goal: str) -> str:
    # Step 1: Generate the plan using CoT
    plan_response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": PLANNING_PROMPT.format(goal=goal)}],
        temperature=0.1
    )
    plan = plan_response.choices[0].message.content
    print(f"📋 Plan:\\n{plan}\\n")
    
    # Step 2: Execute the plan with tools
    # (Pass the plan as context to the agent loop from Lab 2)
    messages = [
        {"role": "system", "content": "Execute this plan carefully: " + plan},
        {"role": "user", "content": goal}
    ]
    # ... continue with the agent loop from Lab 2
    return plan
\`\`\`

---

## Comparison: Accuracy on Math Word Problems

| Technique | Relative Accuracy |
| --- | --- |
| Standard prompting | Baseline |
| Zero-Shot CoT | +15–25% |
| Few-Shot CoT | +25–40% |
| Self-Consistency (n=5) | +35–50% |
| Tree-of-Thought | +40–60% |

Data from original papers (Wei et al., 2022; Yao et al., 2023). Results vary by task and model.

---

## Exercise

Implement a function that uses Few-Shot CoT to help an agent evaluate candidate resumes:

\`\`\`python
def evaluate_candidate(resume_text: str, job_requirements: str) -> dict:
    """
    Use few-shot CoT prompting to evaluate a candidate.
    Return: {
        "technical_score": 0-10,
        "experience_score": 0-10,
        "reasoning": "...",
        "recommendation": "strong_yes | yes | maybe | no"
    }
    """
    # Your implementation here
    pass
\`\`\`

Include at least 2 worked examples in your prompt demonstrating good reasoning about candidate-job fit.

---

## Key Takeaways
- "Let's think step by step" is free performance — always use it for complex tasks
- Few-shot examples teach both the *format* and the *reasoning style* you want
- Self-consistency is the go-to technique when accuracy matters more than cost
- CoT + structured planning makes agents dramatically more reliable
- Tree-of-Thought explores multiple reasoning paths — powerful but expensive`
            },
            {
                title: 'Deploy an Agent with Memory',
                duration: '20 min', durationMin: 20, isFree: false, order: 4,
                content: `# Lab 4 — Deploy an Agent with Persistent Memory

## The Memory Problem

The agents you've built so far have a critical limitation: they're **stateless**. Every conversation starts from scratch. Ask the same user their name twice and the agent has no idea it already knows.

Real-world AI assistants need to remember:
- User preferences and past interactions
- Facts learned in earlier sessions
- Ongoing tasks or projects
- Domain-specific knowledge (company docs, product catalogs)

In this lab, you'll implement a production-grade memory system with **two types of memory** that mirror how humans remember things.

---

## Two Types of Agent Memory

### 1. Short-Term Memory (Conversation Buffer)
Everything the agent has said and done *in the current session*. This lives in the message history you pass to the LLM API. It's automatically cleared when the session ends.

### 2. Long-Term Memory (Vector Store)
Information that persists across sessions. We store memories as **vector embeddings** in a database, then retrieve the most relevant ones when starting a new conversation.

---

## Architecture Overview

\`\`\`
User Message
     |
     v
[Memory Retrieval] — Search vector DB for relevant past memories
     |
     v
[Context Assembly] — Inject retrieved memories into system prompt
     |
     v
[Agent Loop] — Run ReAct loop from Labs 1 & 2
     |
     v
[Memory Storage] — Extract important facts → store in vector DB
     |
     v
Final Answer
\`\`\`

---

## Step 1: Set Up a Vector Store

We'll use **ChromaDB** (local, no API key needed) for this tutorial. In production, you'd use Pinecone, Weaviate, or pgvector.

\`\`\`bash
pip install chromadb openai sentence-transformers
\`\`\`

\`\`\`python
import chromadb
from chromadb.utils import embedding_functions

# Initialize ChromaDB (saves to disk in './agent_memory' folder)
chroma_client = chromadb.PersistentClient(path="./agent_memory")

# Use OpenAI embeddings for production quality
openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key="YOUR_API_KEY",
    model_name="text-embedding-3-small"  # Fast and cheap
)

# Create a collection for our agent's memories
memory_collection = chroma_client.get_or_create_collection(
    name="agent_memories",
    embedding_function=openai_ef
)

print("✅ Vector store initialized!")
\`\`\`

---

## Step 2: Store Memories

After each conversation, extract key facts and store them:

\`\`\`python
import uuid
from datetime import datetime

def store_memory(user_id: str, content: str, memory_type: str = "fact"):
    """
    Store a memory in the vector database.
    
    Args:
        user_id: The user this memory belongs to
        content: The actual memory (a sentence or short paragraph)
        memory_type: "fact", "preference", "event", or "task"
    """
    memory_id = f"{user_id}_{str(uuid.uuid4())[:8]}"
    
    memory_collection.add(
        documents=[content],
        metadatas=[{
            "user_id": user_id,
            "type": memory_type,
            "timestamp": datetime.now().isoformat(),
            "importance": "high" if memory_type in ["preference", "task"] else "normal"
        }],
        ids=[memory_id]
    )
    
    print(f"💾 Stored memory: '{content[:60]}...'")
    return memory_id

# Example: Store facts learned about a user
store_memory("user_123", "The user is a software engineer at a fintech startup in Bangalore.", "fact")
store_memory("user_123", "The user is preparing for FAANG interviews, focusing on system design.", "goal")
store_memory("user_123", "The user prefers concise answers with code examples over long explanations.", "preference")
store_memory("user_123", "The user struggles with dynamic programming problems.", "fact")
\`\`\`

---

## Step 3: Retrieve Relevant Memories

When a new conversation starts, search for memories relevant to the user's query:

\`\`\`python
def retrieve_memories(user_id: str, query: str, n_results: int = 5) -> list[str]:
    """
    Retrieve the most relevant memories for a user given their current query.
    Returns a list of memory strings.
    """
    results = memory_collection.query(
        query_texts=[query],
        n_results=n_results,
        where={"user_id": user_id}  # Filter to only this user's memories
    )
    
    if not results["documents"][0]:
        return []
    
    memories = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        memories.append(f"[{meta['type'].upper()}] {doc}")
    
    return memories

# Test retrieval
memories = retrieve_memories("user_123", "Help me practice a system design interview")
print("Relevant memories found:")
for m in memories:
    print(f"  • {m}")
\`\`\`

**Expected output:**
\`\`\`
Relevant memories found:
  • [GOAL] The user is preparing for FAANG interviews, focusing on system design.
  • [PREFERENCE] The user prefers concise answers with code examples over long explanations.
  • [FACT] The user is a software engineer at a fintech startup in Bangalore.
\`\`\`

The model can now give a *personalized* response that acknowledges their FAANG goal and uses their preferred communication style!

---

## Step 4: Assemble Context with Memories

\`\`\`python
def build_system_prompt(user_id: str, user_query: str) -> str:
    """Build a system prompt that includes relevant memories."""
    
    memories = retrieve_memories(user_id, user_query)
    
    base_prompt = """You are a personalized AI career coach with access to tools and memory.
    
You remember past conversations and use that context to give more relevant, personalized advice.
Always acknowledge what you know about the user when relevant."""
    
    if memories:
        memory_block = "\\n".join(f"- {m}" for m in memories)
        base_prompt += f"""

## What you remember about this user:
{memory_block}

Use these memories to personalize your response. Reference them naturally — don't recite them robotically."""
    
    return base_prompt

# Test it
system_prompt = build_system_prompt("user_123", "Help me prepare for a system design interview")
print(system_prompt)
\`\`\`

---

## Step 5: Auto-Extract New Memories After Each Session

After each conversation ends, use the LLM to extract memorable facts:

\`\`\`python
def extract_and_store_memories(user_id: str, conversation_history: list):
    """Extract key facts from a conversation and store them as memories."""
    
    # Format conversation for analysis
    conversation_text = "\\n".join([
        f"{msg['role'].upper()}: {msg['content']}"
        for msg in conversation_history
        if msg['role'] in ['user', 'assistant']
    ])
    
    extraction_prompt = f"""Analyze this conversation and extract 2-4 important facts to remember about the user.
Only extract facts that would be useful in FUTURE conversations.

Rules:
- Extract user preferences, goals, struggles, and personal context
- Write each memory as a single, self-contained sentence
- Ignore small talk and one-off questions
- Focus on persistent facts, not session-specific details

Conversation:
{conversation_text}

Output format (JSON array):
["memory 1", "memory 2", "memory 3"]"""
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": extraction_prompt}],
        temperature=0,
        response_format={"type": "json_object"}
    )
    
    import json
    data = json.loads(response.choices[0].message.content)
    new_memories = data.get("memories", [])
    
    for memory in new_memories:
        store_memory(user_id, memory, "fact")
    
    print(f"✅ Extracted and stored {len(new_memories)} new memories")
    return new_memories
\`\`\`

---

## Step 6: Full Agent with Memory

Putting it all together:

\`\`\`python
def run_memory_agent(user_id: str, user_query: str) -> str:
    """A complete agent with persistent memory."""
    
    # 1. Build context-aware system prompt
    system_prompt = build_system_prompt(user_id, user_query)
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_query}
    ]
    
    # 2. Run the agent loop (from Lab 2)
    final_answer = run_agent_loop(messages, tools)
    
    # 3. Store this conversation turn as a potential memory
    conversation = [
        {"role": "user", "content": user_query},
        {"role": "assistant", "content": final_answer}
    ]
    extract_and_store_memories(user_id, conversation)
    
    return final_answer

# Simulate two separate sessions
print("=== Session 1 ===")
response1 = run_memory_agent("user_456", "I just started learning Python. Any tips for a beginner?")

print("\\n=== Session 2 (new conversation, 1 week later) ===")
response2 = run_memory_agent("user_456", "What should I learn next?")
# Agent should now remember: "User is a Python beginner" and give appropriate advice
\`\`\`

---

## Production Considerations

### Memory Decay
Not all memories are equally important. Implement decay so old, irrelevant memories fade:

\`\`\`python
def retrieve_memories_with_recency(user_id: str, query: str) -> list[str]:
    results = memory_collection.query(
        query_texts=[query],
        n_results=10,  # Fetch more, then re-rank
        where={"user_id": user_id}
    )
    # Apply recency scoring: newer memories rank higher
    # Combine semantic similarity + recency into a final score
    # Return top 5 after re-ranking
    ...
\`\`\`

### Memory Privacy & Compliance
- Always associate memories with user IDs and allow deletion
- GDPR: provide a "forget me" endpoint that purges all memories for a user
- Never store sensitive data (passwords, financial data, medical info) as plain text

### Memory Abstraction Libraries
In production, use higher-level libraries instead of raw ChromaDB:
- **Mem0** (mem0.ai): Purpose-built for agent memory
- **LangChain Memory:** ConversationSummaryMemory, VectorStoreRetrieverMemory
- **LlamaIndex:** Built-in chat history and document memory

---

## Exercise: Personalized Interview Coach

Build a complete memory-backed interview coach:

\`\`\`python
class InterviewCoach:
    def __init__(self, user_id: str):
        self.user_id = user_id
        # Initialize your vector store and memory retrieval here
    
    def practice_question(self, job_role: str, question: str) -> str:
        """
        Give feedback on the user's answer to an interview question.
        Remember: what topics they've practiced, what they struggled with,
        their target company, and adjust difficulty accordingly.
        """
        # Your implementation here
        pass
    
    def suggest_next_question(self) -> str:
        """
        Based on memory of past sessions, suggest the most valuable
        interview topic to practice next.
        """
        # Your implementation here
        pass
\`\`\`

---

## Key Takeaways
- Agents need two types of memory: short-term (context window) and long-term (vector store)
- Retrieve memories *before* the conversation starts to give the agent context
- Extract and store new memories *after* each session automatically
- Always design for privacy — every memory must be attributable and deletable per user
- Libraries like Mem0 make this production-ready in < 10 lines of code`
            },
        ],
    },
    {
        slug: 'langchain-rag',
        title: 'LangChain & RAG Pipelines',
        description: 'Master Retrieval-Augmented Generation — the backbone of modern AI apps.',
        icon: 'Cpu',
        gradient: 'from-purple-500 to-pink-500',
        cardBg: 'bg-purple-50 dark:bg-gray-800/80',
        border: 'border-purple-200 dark:border-purple-500/30',
        tag: '⬆️ Trending',
        tagColor: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
        totalMinutes: 60,
        order: 2,
        labs: [
            { title: 'How RAG Works: Embeddings & Vector Search', duration: '20 min', durationMin: 20, isFree: true, order: 1, content: `# How RAG Works: Embeddings & Vector Search\n\nUnderstand the fundamentals of semantic search that powers RAG.\n\n## Topics\n- What are embeddings?\n- Cosine similarity vs. dot product\n- How a vector database stores and retrieves embeddings\n- FAISS vs. Pinecone vs. Weaviate` },
            { title: 'Build a Document Q&A App with LangChain', duration: '20 min', durationMin: 20, isFree: true, order: 2, content: `# Build a Document Q&A App with LangChain\n\nCreate a production-style Q&A system over your own documents.\n\n## What You'll Build\nUpload a PDF, chunk it, embed it, store it in a vector DB, and answer questions with citations.` },
            { title: 'Optimize Retrieval & Reduce Hallucinations', duration: '20 min', durationMin: 20, isFree: false, order: 3, content: `# Optimize Retrieval & Reduce Hallucinations\n\nAdvanced RAG techniques to improve accuracy.\n\n## Topics\n- Hybrid search (BM25 + vector)\n- Re-ranking with cross-encoders\n- Contextual compression\n- Self-RAG with faithfulness checks` },
        ],
    },
    {
        slug: 'rust-fundamentals',
        title: 'Rust Fundamentals',
        description: 'Learn the systems programming language known for memory safety and blazing speed.',
        icon: 'Code2',
        gradient: 'from-orange-600 to-amber-500',
        cardBg: 'bg-amber-50 dark:bg-gray-800/80',
        border: 'border-amber-200 dark:border-amber-500/30',
        tag: '⬆️ High Salary',
        tagColor: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
        totalMinutes: 100,
        order: 3,
        labs: [
            { title: 'Ownership, Borrowing & Lifetimes', duration: '20 min', durationMin: 20, isFree: true, order: 1, content: `# Ownership, Borrowing & Lifetimes\n\nRust's core memory model without a garbage collector.\n\n## Topics\n- Ownership rules\n- Move vs. Copy semantics\n- Borrowing and references\n- Lifetime annotations` },
            { title: 'Structs, Enums & Pattern Matching', duration: '20 min', durationMin: 20, isFree: true, order: 2, content: `# Structs, Enums & Pattern Matching\n\nRust's powerful type system and data modelling.\n\n## Topics\n- Struct methods and impl blocks\n- Enums with data (like TypeScript unions)\n- Match expressions and destructuring\n- Option<T> and Result<T, E>` },
            { title: 'Error Handling in Rust', duration: '20 min', durationMin: 20, isFree: false, order: 3, content: `# Error Handling in Rust\n\nBuild robust applications with Rust's explicit error model.\n\n## Topics\n- The ? operator\n- Custom error types\n- thiserror and anyhow crates\n- Converting between error types` },
            { title: 'Traits & Generics', duration: '20 min', durationMin: 20, isFree: false, order: 4, content: `# Traits & Generics\n\nRust's approach to polymorphism and code reuse.\n\n## Topics\n- Defining and implementing traits\n- Generic functions and structs\n- Trait bounds\n- Dynamic dispatch with dyn Trait` },
            { title: 'Build a CLI Tool in Rust', duration: '20 min', durationMin: 20, isFree: false, order: 5, content: `# Build a CLI Tool in Rust\n\nPut it all together — build and ship a real CLI application.\n\n## What You'll Build\nA file-search CLI (like grep) that reads args, walks directories, and prints matches. Fast, zero-dependency, cross-platform binary.` },
        ],
    },
    {
        slug: 'vector-databases',
        title: 'Vector Databases',
        description: 'Understand semantic search, embeddings, and how AI apps store knowledge.',
        icon: 'Activity',
        gradient: 'from-cyan-500 to-blue-500',
        cardBg: 'bg-cyan-50 dark:bg-gray-800/80',
        border: 'border-cyan-200 dark:border-cyan-500/30',
        tag: '⬆️ AI Infrastructure',
        tagColor: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
        totalMinutes: 55,
        order: 4,
        labs: [
            { title: 'What is a Vector & Embedding?', duration: '15 min', durationMin: 15, isFree: true, order: 1, content: `# What is a Vector & Embedding?\n\nThe math and intuition behind modern AI memory.\n\n## Topics\n- Words, sentences, and images as numbers\n- High-dimensional spaces and similarity\n- Generating embeddings with OpenAI / sentence-transformers\n- t-SNE visualization` },
            { title: 'Pinecone & Weaviate Hands-On', duration: '20 min', durationMin: 20, isFree: true, order: 2, content: `# Pinecone & Weaviate Hands-On\n\nUse industry-standard vector databases in a real project.\n\n## What You'll Do\n- Upsert 1,000 product embeddings into Pinecone\n- Query by semantic similarity\n- Same exercise in Weaviate with GraphQL API` },
            { title: 'Build a Semantic Search Engine', duration: '20 min', durationMin: 20, isFree: false, order: 3, content: `# Build a Semantic Search Engine\n\nShip a full-stack semantic search feature.\n\n## What You'll Build\nA job-search engine that returns results based on meaning, not just keywords. FastAPI backend + React frontend + Pinecone.` },
        ],
    },
];

// Current week number helper
function getWeekNumber(date: Date): { week: number; year: number } {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return {
        week: Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7),
        year: d.getUTCFullYear(),
    };
}

async function seed() {
    console.log('🌱 Seeding Future-Ready Lab data...');

    for (const trackData of TRACKS) {
        const { labs, ...track } = trackData;
        const trackId = require('crypto').randomUUID();

        // Upsert track via raw SQL (avoids camelCase Prisma mapping issues)
        await prisma.$executeRaw`
            INSERT INTO lab_tracks (id, slug, title, description, icon, gradient, card_bg, border, tag, tag_color, total_minutes, "order", is_active, created_at, updated_at)
            VALUES (
                ${trackId}, ${track.slug}, ${track.title}, ${track.description},
                ${track.icon}, ${track.gradient}, ${track.cardBg}, ${track.border},
                ${track.tag}, ${track.tagColor}, ${track.totalMinutes}, ${track.order},
                true, NOW(), NOW()
            )
            ON CONFLICT (slug) DO UPDATE SET
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                gradient = EXCLUDED.gradient,
                card_bg = EXCLUDED.card_bg,
                border = EXCLUDED.border,
                tag = EXCLUDED.tag,
                tag_color = EXCLUDED.tag_color,
                total_minutes = EXCLUDED.total_minutes,
                "order" = EXCLUDED."order",
                updated_at = NOW()
        `;

        // Get actual track id (may differ if the slug already existed)
        const [existing] = await prisma.$queryRaw<{ id: string }[]>`
            SELECT id FROM lab_tracks WHERE slug = ${track.slug}
        `;
        const dbTrackId = existing.id;
        console.log(`  ✅ Track: ${track.title} (${dbTrackId})`);

        for (const lab of labs) {
            await prisma.$executeRaw`
                INSERT INTO labs (id, track_id, title, content, duration, duration_min, is_free, "order", is_active, created_at)
                VALUES (
                    gen_random_uuid(), ${dbTrackId}, ${lab.title}, ${lab.content ?? ''},
                    ${lab.duration}, ${lab.durationMin}, ${lab.isFree}, ${lab.order}, true, NOW()
                )
                ON CONFLICT (track_id, "order") DO UPDATE SET
                    title = EXCLUDED.title,
                    content = EXCLUDED.content,
                    duration = EXCLUDED.duration,
                    duration_min = EXCLUDED.duration_min,
                    is_free = EXCLUDED.is_free
            `;
        }
        console.log(`     ↳ ${labs.length} labs seeded`);
    }

    // Seed this week's challenge
    const { week, year } = getWeekNumber(new Date());
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + (7 - deadline.getDay()));
    deadline.setHours(23, 59, 59, 0);

    await prisma.$executeRaw`
        INSERT INTO weekly_challenges (id, title, description, difficulty, reward, xp_reward, deadline, week_number, year, is_active, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'Build a Simple AI Chatbot with Memory',
            'Create a chatbot using any LLM API that remembers conversation context across at least 5 turns. Document your approach with a short write-up or GitHub repo.',
            'Intermediate',
            '+150 XP + Builder Badge',
            150,
            ${deadline},
            ${week},
            ${year},
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (week_number, year) DO NOTHING
    `;

    console.log(`  ✅ Weekly Challenge (Week ${week}/${year}) seeded`);
    console.log('🎉 Seeding complete!');
}

seed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
