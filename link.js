const LINKS_DATA = [
  {
    "url": "https://suttacentral.net",
    "name": "SuttaCentral",
    "type": 1
  },
  {
    "url": "http://agama.buddhason.org",
    "name": "庄春江工作站",
    "type": 1
  },
  {
    "url": "https://www.earlybuddhism.org.hk/?wp=3.1",
    "name": "蕭式球翻译的巴利语经典",
    "type": 1
  },
  {
    "url": "http://pathtorealization.blogspot.com",
    "name": "《念住，通往证悟的直接之道》译注",
    "type": 1
  },
  {
    "url": "https://nanda.online-dhamma.net/tipitaka/sutta/majjhima/maps-MN-Bodhi/",
    "name": "《中部尼柯耶》閱讀地圖",
    "type": 1
  },
  {
    "url": "http://www.ahanjing.top",
    "name": "阿含经在线阅读",
    "type": 1
  },
  {
    "url": "http://buddhistinformatics.chibs.edu.tw/BZA/index_zh.html",
    "name": "别译杂阿含",
    "type": 1
  },
  {
    "url": "http://jingwen.buddh.cn/mulu/lvzang/yuanhenglvzang(1-2).html",
    "name": "律藏",
    "type": 1
  },
  {
    "url": "https://www.jcedu.org/200601/5689.html",
    "name": "戒幢-阿含经专题",
    "type": 1
  },
  {
    "url": "http://jingwen.buddh.cn",
    "name": "三藏经典",
    "type": 1
  },
  {
    "url": "http://www.agamarama.com",
    "name": "阿含学苑",
    "type": 1
  },
  {
    "url": "http://www.gaya.org.tw/library/palitipitaka/index.asp",
    "name": "南传大藏经目录检索系统",
    "type": 1
  },
  {
    "url": "http://tipitaka.sutta.org",
    "name": "巴利语三藏",
    "type": 1
  },
  {
    "url": "http://yifert210.blogspot.com",
    "name": "《法句经》校勘與標點",
    "type": 1
  },
  {
    "url": "http://kennethyee22d-03b01.blogspot.com",
    "name": "法句经",
    "type": 1
  },
  {
    "url": "https://sites.google.com/site/palishengdian/pali/va/dv/dv3",
    "name": "巴利圣典",
    "type": 1
  },
  {
    "url": "http://www.dhammatalks.org/index.html",
    "name": "巴利三藏(英语版)",
    "type": 1
  },
  {
    "url": "http://buddhaspace.org/main/modules/dokuwiki/",
    "name": "台大狮子吼阿含专案",
    "type": 1
  },
  {
    "url": "http://buddhaspace.org/agama/",
    "name": "《好讀 雜阿含經》",
    "type": 1
  },
  {
    "url": "https://www.dhammatalks.org",
    "name": "Dhammatalks",
    "type": 1
  },
  {
    "url": "http://www.agamarama.com/Pali_Tipitaka_utf8_html/pali_tipitaka_utf8_index.htm",
    "name": "PTS巴利语经藏在线",
    "type": 1
  },
  {
    "url": "http://tripitaka.cbeta.org/ko/N",
    "name": "汉译南传大藏经",
    "type": 1
  },
  {
    "url": "https://www.tipitaka.org",
    "name": "VRI 緬甸版巴利大藏經",
    "type": 1
  },
  {
    "url": "https://www.accesstoinsight.org/index.html",
    "name": "Access to Insight",
    "type": 1
  },
  {
    "url": "http://theravadacn.com/Buddha.htm",
    "name": "佛：巴利经典中的佛陀生平",
    "type": 1
  },
  {
    "url": "http://www.theravadacn.org/Gradual.htm",
    "name": "法：佛陀的次第说法",
    "type": 1
  },
  {
    "url": "http://theravadacn.com/Sangha.htm",
    "name": "僧：巴利经文中僧伽的定义",
    "type": 1
  },
  {
    "url": "http://cbetaonline.cn/zh/T0001_001",
    "name": "大藏经",
    "type": 1
  },
  {
    "url": "https://sites.google.com/site/palishengdian/pali",
    "name": "巴利圣典",
    "type": 1
  },
  {
    "url": "http://www.godwin.org.hk/presentation.html",
    "name": "葛荣居士禅修讲录",
    "type": 2
  },
  {
    "url": "http://www.gaya.org.tw/publisher/fasan/abstract/index.htm",
    "name": "《舍利弗的一生》",
    "type": 2
  },
  {
    "url": "http://www.gaya.org.tw/publisher/fasan/The%20Noble%20Eightfold%20Path/The%20Noble%20Eightfold%20Path.htm",
    "name": "菩提比丘《八正道》",
    "type": 2
  },
  {
    "url": "http://www.gaya.org.tw/publisher/fasan/The_Vision_of_Dhamma/TheVision_ofDhamma.htm",
    "name": "向智尊者《法见》",
    "type": 2
  },
  {
    "url": "http://www.dhammatalks.net/",
    "name": "DhammaTalks",
    "type": 2
  },
  {
    "url": "http://www.theravadacn.org/",
    "name": "上座部佛教文献选译集",
    "type": 2
  },
  {
    "url": "http://www.theravadacn.org/Talk/ThaiForestindex.htm",
    "name": "泰国林居传统导师开示",
    "type": 2
  },
  {
    "url": "http://www.fosss.org/Book/AJiangCha/",
    "name": "阿姜查的禅修世界",
    "type": 2
  },
  {
    "url": "http://www.oba.org.tw",
    "name": "台湾原始佛教协会",
    "type": 3
  },
  {
    "url": "https://dictionary.sutta.org/",
    "name": "巴利语辞典",
    "type": 3
  },
  {
    "url": "http://www.dhammarain.org.tw/canon/canon1.html",
    "name": "法雨道场",
    "type": 3
  },
  {
    "url": "http://yifertw.blogspot.com/",
    "name": "台語與佛典",
    "type": 3
  },
  {
    "url": "http://forestdhamma.org",
    "name": "Forest Dhamma",
    "type": 3
  },
  {
    "url": "http://dharmaseed.org",
    "name": "Dharma seed",
    "type": 3
  },
  {
    "url": "https://www.dhamma.com/zh/",
    "name": "隆波帕默法谈",
    "type": 3
  },
  {
    "url": "https://www.earlybuddhism.org.hk/",
    "name": "原始佛教研修会",
    "type": 3
  },
  {
    "url": "https://www.knownsee.com/%E9%A6%96%E9%A0%81",
    "name": "如实知见",
    "type": 3
  }
];