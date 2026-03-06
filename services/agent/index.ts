// Consolidated Agent Service Module
// Unifies AI agent orchestration, tool execution, and context management

export * from './agentTools';
export * from './agentContext';
export * from './geminiService';
export * from './geminiUtils';

// Re-export main orchestration functions for convenience
export { runAgentTurn, type AgentTurnInput, type AgentTurnOutput } from './geminiService';
export { runAgentToolCall, runAgentToolCalls, type AgentToolCall, type AgentToolResult, type AgentToolName } from './agentTools';
export { buildAgentContextSnapshot, getAgentCapabilities, type AgentContextSnapshot, type AgentCapabilities } from './agentContext';
