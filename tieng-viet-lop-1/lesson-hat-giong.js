window.TV1_LESSON = {
  id: 'tv1-hat-giong-nho-v3',
  title: 'Hạt giống nhỏ',
  ttsDisabled: true,
  duration: '20–25 phút',
  goal: [
    'Tự đọc được toàn bộ bài “Hạt giống nhỏ” theo từng câu.',
    'Khi bí một tiếng, biết tìm vần → tách âm đầu + vần + thanh → tự ghép lại.',
    'Phân biệt và vận dụng các cấu trúc uông / ương / ươn / ươc trong tiếng mới.',
    'Hiểu được diễn biến chính của câu chuyện, không chỉ đọc thành tiếng.'
  ],
  difficulty: {
    easy: ['một','hạt','nhỏ','nằm','bên','bé','đem','về','thả','góc','chỉ','ít','hôm','mầm','non','đã','lên','lá','rung','như','cảm','ơn'],
    attention: ['giống','lặng','lẽ','nhặt','giọt','khẽ','muốn'],
    key: ['đường','được','xuống','vườn','vươn','uống','những','sương']
  },
  warmup: {
    prompts: [
      'Con thấy bạn nhỏ đang làm gì?',
      'Con đoán cây non này mọc lên từ đâu?',
      'Theo con, hạt giống có “cảm ơn” bạn nhỏ được không?'
    ]
  },
  keyWords: [
    {
      word:'đường',
      family:'ương / ường',
      hints:[
        'Tìm vần: ương.',
        'Thêm thanh huyền: ương → ường.',
        'Ghép âm đầu: đ + ường.',
        'Ghép lại: đ + ường → đường.'
      ],
      phrase:'bên đường',
      sentence:'Hạt giống nằm bên đường.',
      transfer:['sương','dường','giường']
    },
    {
      word:'được',
      family:'ươc / ược',
      hints:[
        'Tìm vần: ươc.',
        'Thêm thanh nặng: ươc → ược.',
        'Ghép âm đầu: đ + ược.',
        'Ghép lại: đ + ược → được.'
      ],
      phrase:'nhặt được',
      sentence:'Bé nhặt được hạt giống.',
      transfer:['ước','thước','nước']
    },
    {
      word:'xuống',
      family:'uông / uống',
      hints:[
        'Tìm vần: uông.',
        'Thêm thanh sắc: uông → uống.',
        'Ghép âm đầu: x + uống.',
        'Ghép lại: x + uống → xuống.'
      ],
      phrase:'thả xuống',
      sentence:'Bé thả hạt xuống đất.',
      transfer:['uống','chuông']
    },
    {
      word:'vườn',
      family:'ươn / ườn',
      hints:[
        'Tìm vần: ươn.',
        'Thêm thanh huyền: ươn → ườn.',
        'Ghép âm đầu: v + ườn.',
        'Ghép lại: v + ườn → vườn.'
      ],
      phrase:'góc vườn',
      sentence:'Bé đem hạt về vườn.',
      transfer:['vươn','lươn']
    },
    {
      word:'vươn',
      family:'ươn',
      hints:[
        'Tìm vần: ươn.',
        'Tiếng này không có thanh dấu.',
        'Ghép âm đầu: v + ươn.',
        'Ghép lại: v + ươn → vươn.'
      ],
      phrase:'vươn lên',
      sentence:'Mầm non vươn lên.',
      transfer:['vườn','lươn']
    },
    {
      word:'uống',
      family:'uông / uống',
      hints:[
        'Tìm vần: uông.',
        'Thêm thanh sắc: uông → uống.',
        'Không có phụ âm đầu.',
        'Ghép lại: uông + sắc → uống.'
      ],
      phrase:'uống những giọt sương',
      sentence:'Cây non uống nước.',
      transfer:['xuống','chuông']
    },
    {
      word:'những',
      family:'ưng / ững',
      hints:[
        'Tìm vần: ưng.',
        'Thêm thanh ngã: ưng → ững.',
        'Ghép âm đầu: nh + ững.',
        'Ghép lại: nh + ững → những.'
      ],
      phrase:'những giọt sương',
      sentence:'Những giọt sương long lanh.',
      transfer:['chững','vững']
    },
    {
      word:'sương',
      family:'ương',
      hints:[
        'Tìm vần: ương.',
        'Tiếng này không có thanh dấu.',
        'Ghép âm đầu: s + ương.',
        'Ghép lại: s + ương → sương.'
      ],
      phrase:'giọt sương',
      sentence:'Sáng sớm có sương.',
      transfer:['đường','dường','giường']
    }
  ],
  rimeDrills: [
    {title:'Nhà ương / ường', pattern:'ương', words:['sương','đường','dường','giường']},
    {title:'Nhà ươn / ườn', pattern:'ươn', words:['vươn','vườn','lươn']},
    {title:'Nhà uông / uống', pattern:'uông', words:['uống','xuống','chuông']},
    {title:'Nhà ươc', pattern:'ươc', words:['được','ước','thước','nước']}
  ],
  quickGame: [
    {prompt:'Từ nào cùng họ vần với “đường”?', choices:['sương','xuống','được'], answer:'sương'},
    {prompt:'Từ nào cùng họ vần với “vươn”?', choices:['vườn','đường','uống'], answer:'vườn'},
    {prompt:'Từ nào có vần uông?', choices:['chuông','thước','sương'], answer:'chuông'},
    {prompt:'Từ nào có vần ươc?', choices:['nước','vườn','đường'], answer:'nước'}
  ],
  story: {
    title:'Hạt giống nhỏ',
    sentences:[
      {
        text:'Một hạt giống nhỏ nằm lặng lẽ bên đường.',
        chunks:['Một hạt giống nhỏ','nằm lặng lẽ','bên đường.'],
        check:'Hạt giống nhỏ nằm ở đâu?',
        answer:'Bên đường.'
      },
      {
        text:'Bé nhặt được, đem về thả xuống góc vườn.',
        chunks:['Bé nhặt được,','đem về','thả xuống góc vườn.'],
        check:'Bé làm gì với hạt giống?',
        answer:'Bé nhặt được, đem về thả xuống góc vườn.'
      },
      {
        text:'Chỉ ít hôm, mầm non đã vươn lên, uống những giọt sương sớm.',
        chunks:['Chỉ ít hôm,','mầm non đã vươn lên,','uống những giọt sương sớm.'],
        check:'Mầm non làm gì?',
        answer:'Mầm non vươn lên và uống những giọt sương sớm.'
      },
      {
        text:'Lá non khẽ rung rung.',
        chunks:['Lá non','khẽ rung rung.'],
        check:'Lá non thế nào?',
        answer:'Lá non khẽ rung rung.'
      },
      {
        text:'Dường như lá muốn cảm ơn bé.',
        chunks:['Dường như','lá muốn cảm ơn bé.'],
        check:'Lá dường như muốn làm gì?',
        answer:'Lá muốn cảm ơn bé.'
      }
    ]
  },
  comprehension: [
    {
      prompt:'Hạt giống lúc đầu ở đâu?',
      choices:['Bên đường.','Trong chậu.','Trong nhà.'],
      answer:'Bên đường.'
    },
    {
      prompt:'Bé đã làm gì với hạt giống?',
      choices:['Nhặt và đem về góc vườn.','Bỏ đi.','Đem cho bạn.'],
      answer:'Nhặt và đem về góc vườn.'
    },
    {
      prompt:'Sau ít hôm, mầm non thế nào?',
      choices:['Đã vươn lên.','Vẫn nằm im.','Bị khô.'],
      answer:'Đã vươn lên.'
    },
    {
      prompt:'Vì sao dường như lá muốn cảm ơn bé?',
      choices:['Vì bé đã giúp hạt giống có chỗ mọc lên.','Vì bé hái lá.','Vì bé làm lá rung.'],
      answer:'Vì bé đã giúp hạt giống có chỗ mọc lên.'
    }
  ],
  matching: [
    {left:'Mầm non',right:'đã vươn lên.'},
    {left:'Lá non',right:'khẽ rung rung.'}
  ],
  fullText:[
    'Một hạt giống nhỏ nằm lặng lẽ bên đường.',
    'Bé nhặt được, đem về thả xuống góc vườn.',
    'Chỉ ít hôm, mầm non đã vươn lên, uống những giọt sương sớm.',
    'Lá non khẽ rung rung.',
    'Dường như lá muốn cảm ơn bé.'
  ],
  finalChallenge: [
    'Em ngủ trên giường.',
    'Chuông reo rất to.',
    'Bé dùng thước kẻ.',
    'Mầm cây vươn cao.',
    'Em được mẹ khen.'
  ],
  review: {
    end:['đường','được','xuống','vườn','vươn','uống','những','sương'],
    day1:[
      'Con đường rất dài.',
      'Bé uống nước.',
      'Cây non vươn lên.',
      'Em được quà.'
    ],
    day3:[
      'Em ngủ trên giường.',
      'Chuông trường reo.',
      'Bé dùng thước kẻ.',
      'Sáng sớm có sương.'
    ],
    day7:[
      'Em đi trên đường.',
      'Cây vươn cao trong vườn.',
      'Em uống nước rồi dùng thước kẻ.',
      'Những giọt sương còn trên lá.'
    ]
  },
  writing:['uống','giường','ước','thước']
};