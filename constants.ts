
import { Scenario, Outfit, MaleLead } from './types';

// Helper to generate consistent AI images with strict "Manhwa/Otome" styling
// Updated to match the "Dark Fantasy / Korean Manhwa" aesthetic from user reference
// Keywords: Tattoos, Piercings, Jewelry, Semi-realistic, Moody Lighting
const getAIImage = (prompt: string, seed: number) => 
  `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt + ", (korean manhwa style:1.5), (otome game art:1.4), (detailed beautiful face:1.5), (semi-realistic:1.4), best quality, 8k, detailed eyes, glossy lips, sharp jawline, cinematic lighting"
  )}?nologo=true&width=720&height=1280&seed=${seed}`;

export const OUTFITS: Outfit[] = [
  {
    id: 'outfit_domination',
    name: '银河女帝的荆棘冠冕',
    description: '由暗物质与星尘凝聚而成的黑色礼服，自带让生物基因战栗的威压。',
    powerName: '天赋：绝对支配',
    powerEffect: '你的言语即是法旨。任何兽人在你面前都会感受到基因层面的压制，不得不跪下臣服。你是他们的女王，也是唯一的主宰。',
    image: getAIImage('majestic empress concept art, wearing black gothic sci-fi dress, crown of thorns, dark energy aura, glowing purple eyes, commanding pose, space nebula background, floating particles, intense expression, elegant, dangerous beauty, full body', 101),
    style: 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
  },
  {
    id: 'outfit_wealth',
    name: '星际财阀的至尊权杖',
    description: '流淌着液态金的纳米战衣，象征着掌控全宇宙资源的权力。',
    powerName: '天赋：资源无限',
    powerEffect: '你拥有买下整个星系的财富。你可以瞬间调动全宇宙的物资，无论是稀缺的能量矿，还是纯净的食物，你挥挥手就能填满一个星球。',
    image: getAIImage('elegant noble woman concept art, wearing golden sci-fi armor suit, holding a jeweled scepter, floating gold holographic coins, luxury spaceship interior background, confident smile, wealthy, extravagant, full body', 102),
    style: 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]'
  },
  {
    id: 'outfit_charm',
    name: '纯血夏娃的费洛蒙',
    description: '看似简单却极致诱惑的纯白丝绸长裙，散发着让兽人发狂的甜美气息。',
    powerName: '天赋：基因暴动',
    powerEffect: '你是宇宙中唯一的解药，也是最剧烈的毒药。你的气味能安抚兽人的基因崩溃，也能让他们因求偶欲而陷入疯狂的修罗场。',
    image: getAIImage('pure innocent beautiful woman concept art, wearing white silk slip dress, soft glowing light, pheromone mist, flowers in space, ethereal, fragile beauty, blushing, messy hair, full body', 103),
    style: 'border-pink-400 shadow-[0_0_20px_rgba(244,114,182,0.5)]'
  }
];

export const MAIN_SCENARIO: Scenario = {
  id: 'scenario_interstellar',
  title: '星际兽世：最后的纯血',
  description: '这是一个科技高度发达但基因崩溃的星际时代。雌性人类早已灭绝，兽人们虽然拥有毁天灭地的力量，却饱受狂躁症的折磨。直到有一天，你——全宇宙唯一的纯血人类女性，肉身穿越而来。',
  worldSetting: '星际未来风格。高楼大厦与原始丛林并存。设定包含【雄性生子/孕育】技术（人造子宫或种族天赋）。纯血人类女性是至高无上的存在。',
  introText: '检测到高维生命体接入... 正在匹配位面... 锁定坐标：星际联邦... 身份生成：唯一纯血人类...',
  goal: '在这个雄性遍地走的危险世界里，利用你的天赋，建立属于你的后宫/帝国。'
};

export const MALE_LEADS: MaleLead[] = [
  {
    id: 'ml_snake',
    name: '烛阴 (Zhu Yin)',
    species: '深渊玄蛇',
    archetype: '冷血军阀 / 只要体温的粘人精',
    appearance: '如墨般的长发散落在军装肩章上，金色的竖瞳透着冰冷的杀意，却在看向你时融化成水。',
    personality: '【外冷内粘】他是让人闻风丧胆的星际统帅。因为本体体温极低，他患有严重的皮肤饥渴症。他只想在深夜变回本体，用冰凉的鳞片蹭你的手心，卑微地乞求你的一点点体温。',
    obsessionType: '“姐姐，别推开我……我只是想暖和一点，就一点……”',
    // Matches the snake image: Dark hair, snake headgear/horns, yellow eyes, uniform
    image: getAIImage('portrait of handsome anime man, black hair, intense yellow snake eyes, wearing dark military uniform with snake scales texture, snake horns on head, pale skin, dark atmosphere, dangerous, detailed face', 555),
    favorability: 0,
    pregnancy: 0,
    haremStatus: '敌对'
  },
  {
    id: 'ml_wolf',
    name: '苍牙 (Cang Ya)',
    species: '银月霜狼',
    archetype: '卑微忠犬 / 奴隶护卫',
    appearance: '银灰色的短发，头顶耸立着毛茸茸的狼耳，脖子上戴着象征奴隶的止咬环，身材有着完美的肌肉线条。',
    personality: '【卑微忠犬】他自认是低贱的混血种，连仰视你都觉得是亵渎。他不要名分，不求宠爱，只求能跪在你的王座之下，做你最锋利的刀。',
    obsessionType: '“主人，像我这种低贱的狗，不配弄脏您的床……我可以睡在地毯上吗？”',
    // Matches the wolf image: Grey hair, wolf ears, metal collar, open shirt
    image: getAIImage('portrait of handsome anime man, silver grey hair, wolf ears, wearing metal slave collar, open white shirt revealing muscular chest, intense submissive gaze, sweat, detailed face, semi-realistic', 666),
    favorability: 10,
    pregnancy: 0,
    haremStatus: '陌生人'
  },
  {
    id: 'ml_fox',
    name: '涂山 (Tu Shan)',
    species: '九尾天狐',
    archetype: '帝国宰相 / 顶级绿茶',
    appearance: '粉白渐变的长发，总是眯着眼笑，穿着繁复华丽的古风改良礼服，身后九条尾巴虚影摇曳。',
    personality: '【心机绿茶】看似温柔无害的笑面虎，实则心机深沉。在别的男人面前重拳出击，在你面前柔弱不能自理，手指破个皮都要你吹吹。',
    obsessionType: '“哎呀，苍牙将军怎么这么粗鲁？不像我，只会心疼姐姐~”',
    // Matches the fox image: Pink/White long hair, fox ears, 9 tails, open chest
    image: getAIImage('portrait of beautiful anime man, long pink and white hair, fox ears, nine large fluffy fox tails behind, wearing fantasy silk robe open at chest, soft smiling expression, seductive, beautiful face, ethereal lighting', 777),
    favorability: 5,
    pregnancy: 0,
    haremStatus: '陌生人'
  },
  {
    id: 'ml_peacock',
    name: '玄翎 (Xuan Ling)',
    species: '极光孔雀',
    archetype: '星际首富 / 傲娇花瓶',
    appearance: '拥有一头炫目的孔雀蓝卷发，五官精致得像个妖孽，衣着极其浮夸华丽，满身宝石。',
    personality: '【傲娇自恋】全宇宙最美的雄性（自封）。一开始对你嗤之以鼻，直到被你的信息素征服，他开始疯狂整容、买衣服，像个开屏的孔雀一样在你面前晃来晃去。',
    obsessionType: '“喂，这颗星球送你了……别误会！我只是嫌它占地方！”',
    // Matches the peacock image: Cyan curly hair, gemstone rings, finger on lip
    image: getAIImage('portrait of beautiful anime man, cyan blue curly hair, wearing many large gemstone rings on fingers, finger touching lips, heavy jewelry, arrogant confident expression, sparkling background, detailed eyes, makeup', 888),
    favorability: 0,
    pregnancy: 0,
    haremStatus: '敌对'
  },
  {
    id: 'ml_spider',
    name: '莫斯 (Morse)',
    species: '星网魔蛛',
    archetype: '暗网首领 / 抖M被捕食者',
    appearance: '黑发红瞳，戴着金丝眼镜，斯文败类。背后的阴影里潜伏着机械蛛矛。',
    personality: '【变态抖M】掌控全宇宙黑暗网络的疯子。对于他来说，被你束缚、被你践踏、甚至被你“吃掉”，才是最高级的快感。',
    obsessionType: '“陛下，请收紧您的网……让我窒息在您的掌心里。”',
    // Matches the spider image: Black hair, red eyes, glasses, spider legs
    image: getAIImage('portrait of handsome anime man, black hair, red glowing eyes, wearing gold glasses, white shirt, spider legs appearing from back shadows, villain smile, dangerous atmosphere, sharp focus', 999),
    favorability: -10,
    pregnancy: 0,
    haremStatus: '敌对'
  },
    {
    id: 'ml_rabbit',
    name: '西诺 (Cino)',
    species: '垂耳白兔',
    archetype: '疯狂医生 / 白切黑',
    appearance: '看起来像个未成年的天使，有着软软的垂耳和无辜的红眼睛，身上穿着染血的白大褂。',
    personality: '【病娇白切黑】星际最顶尖的基因博士。外表是治愈系小可爱，切开全是黑泥。他想把你解剖了研究，又想把你锁在无菌室里独占。',
    obsessionType: '“姐姐的基因真完美……好想把你做成标本，这样你就永远属于我了……开玩笑的哦~”',
    // Matches the rabbit image: White hair, bunny ears, blood stains, lab coat
    image: getAIImage('portrait of cute anime boy, white hair, rabbit ears, red eyes, wearing white lab coat with blood stains, white wings background, innocent but creepy expression, high contrast, detailed face', 444),
    favorability: 20,
    pregnancy: 0,
    haremStatus: '陌生人'
  }
];
