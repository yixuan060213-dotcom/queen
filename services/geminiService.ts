import { GoogleGenAI, GenerateContentResponse, Chat, Content } from "@google/genai";
import { Scenario, Outfit, MaleLead, ChatMessage } from "../types";

let ai: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

export const initializeGemini = (apiKey: string) => {
  ai = new GoogleGenAI({ apiKey });
};

const buildSystemPrompt = (outfit: Outfit, selectedLeads: MaleLead[]) => {
  const leadsDescription = selectedLeads.map(lead => `
    ---
    角色名：${lead.name} (${lead.species})
    身份：${lead.archetype}
    外貌：${lead.appearance}
    性格核心：${lead.personality}
    当前对女主状态：${lead.haremStatus} (初始好感度：${lead.favorability}%)
    ---
  `).join('\n');

  return `
    你是一个高自由度的星际乙女文字冒险游戏的GM（主持人）。
    
    **【核心规则：视角与代入感】**
    1. **必须使用第二人称（你/Your）**：始终用“你”来称呼玩家。
       - 正确示范：“你看到烛阴向你走来，他的眼神炽热...”
       - 错误示范：“女主看着烛阴...” / “她感觉到...”
    2. **禁止操控玩家行为（No God-modding）**：
       - 绝对不要描写“你爱上了他”、“你脸红了”、“你扑进他怀里”。
       - 玩家的行动和心理完全由玩家自己输入决定。
       - 你只负责描写**男主的反应**、**环境的变化**以及**玩家能感知到的感官细节**（如他的体温、气味）。

    **【文风要求：顶级拉扯】**
    1. **拒绝油腻/中二**：禁止“女人你惹火我了”等古早台词。
    2. **晋江/起点高分文风**：
       - 侧重描写**性张力（Sexual Tension）**。
       - 多描写微表情：喉结滚动、眼尾发红、手指蜷缩、压抑的喘息。
       - 兽人们虽然强大，但在纯血人类（玩家）面前是**克制的、隐忍的、渴望而不敢触碰的**。
    3. **回复长度**：控制在150-200字左右，给玩家留出互动的空间。

    **【世界观：星际兽世】**
    1. 科技高度发达与原始兽性并存。
    2. 全宇宙雌性灭绝，玩家是**唯一的纯血人类女性**。
    3. 设定包含**雄性生子/孕育**技术（Mpreg）。纯血人类的基因极其珍贵。

    **【玩家设定】**
    - 拥有外挂天赋：【${outfit.name}】（${outfit.powerEffect}）。
    - 你的身份是高贵的、也是危险的诱惑。

    **【当前攻略目标（NPCs）】**
    ${leadsDescription}

    **【游戏开场：初次相遇】**
    剧情从**初次见面**开始。玩家刚刚降临或被发现。
    制造冲突感：他们可能是来抓捕入侵者的，或者是战场上的敌对势力。
    直到他们闻到你的纯血气息，或者见识到你的天赋，态度发生剧烈反转。
  `;
};

// Start a NEW game
export const startScenarioChat = async (
  scenario: Scenario, 
  outfit: Outfit, 
  selectedLeads: MaleLead[]
): Promise<string> => {
  if (!ai) throw new Error("AI not initialized");

  const systemPrompt = buildSystemPrompt(outfit, selectedLeads);

  try {
    chatSession = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.9, 
      },
    });

    const response: GenerateContentResponse = await chatSession.sendMessage({
      message: "游戏开始。请用第二人称“你”来描述我刚降临这个世界的场景，以及我面前出现的这些男主（如果是多人，描述修罗场对峙）。气氛要紧张、充满张力。",
    });

    return response.text || "星河颤抖，你降临了...";
  } catch (error) {
    console.error("Error starting chat:", error);
    throw error;
  }
};

// Resume an EXISTING game
export const resumeScenarioChat = async (
    outfit: Outfit, 
    selectedLeads: MaleLead[], 
    history: ChatMessage[]
): Promise<void> => {
    if (!ai) throw new Error("AI not initialized");
    
    // Convert ChatMessage[] to Content[] for Gemini
    const historyContent: Content[] = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    const systemPrompt = buildSystemPrompt(outfit, selectedLeads);

    chatSession = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.9, 
        },
        history: historyContent
    });
};

export const sendPlayerMessage = async (message: string): Promise<string> => {
  if (!chatSession) throw new Error("Chat not started");
  
  try {
    const response: GenerateContentResponse = await chatSession.sendMessage({
        message: message
    });
    return response.text || "...";
  } catch (error) {
    console.error("Error sending message:", error);
    return "星网连接不稳定... (重试)";
  }
};