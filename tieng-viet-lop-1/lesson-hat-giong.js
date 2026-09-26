window.TV1_LESSON = {
  id: 'tv1-hat-giong-nho',
  title: 'Hạt giống nhỏ',
  subtitle: 'uông · ương · ươc',
  goal: 'Nghe và phân biệt được uông, ương, ươc; đánh vần 4 từ trọng tâm; đọc hiểu bài Hạt giống nhỏ và nhớ lại sau khi che chữ.',
  principles: [
    'Học theo cụm vần thay vì đọc rời từng chữ',
    'Nghe trước – tự đoán – rồi mới xem đáp án',
    'Đọc câu theo cụm nghĩa, không kéo từng tiếng',
    'Nhớ lại sau khi che chữ để chống học vẹt'
  ],
  rimes: [
    {id:'uong', text:'uông', ending:'ng', cue:'u + ô + ng', color:'blue'},
    {id:'uong2', text:'ương', ending:'ng', cue:'ư + ơ + ng', color:'green'},
    {id:'uoc', text:'ươc', ending:'c', cue:'ư + ơ + c', color:'orange'}
  ],
  focusWords: [
    {id:'uong-word', word:'uống', onset:'', rime:'uông', tone:'sắc', build:'uông + sắc → uống', meaning:'uống nước'},
    {id:'giuong', word:'giường', onset:'gi', rime:'ương', tone:'huyền', build:'gi + ương → giương; thêm huyền → giường', meaning:'cái giường'},
    {id:'uoc-word', word:'ước', onset:'', rime:'ươc', tone:'sắc', build:'ươc + sắc → ước', meaning:'mong ước'},
    {id:'thuoc', word:'thước', onset:'th', rime:'ươc', tone:'sắc', build:'th + ươc → thươc; thêm sắc → thước', meaning:'cái thước'}
  ],
  sortWords: [
    {word:'uống', rime:'uông'},
    {word:'xuống', rime:'uông'},
    {word:'chuông', rime:'uông'},
    {word:'đường', rime:'ương'},
    {word:'sương', rime:'ương'},
    {word:'giường', rime:'ương'},
    {word:'ước', rime:'ươc'},
    {word:'thước', rime:'ươc'},
    {word:'nước', rime:'ươc'}
  ],
  story: {
    title:'Hạt giống nhỏ',
    sentences:[
      'Một hạt giống nhỏ nằm lặng lẽ bên đường.',
      'Bé nhặt được, đem về thả xuống góc vườn.',
      'Chỉ ít hôm, mầm non đã vươn lên, uống những giọt sương sớm.',
      'Lá non khẽ rung rung.',
      'Dường như lá muốn cảm ơn bé.'
    ],
    questions:[
      {
        prompt:'Bé làm gì khi nhặt được hạt giống?',
        choices:['Đem về thả xuống góc vườn.','Để lại bên đường.'],
        answer:'Đem về thả xuống góc vườn.'
      },
      {
        prompt:'Sau ít hôm, mầm non thế nào?',
        choices:['Đã vươn lên.','Vẫn nằm im.'],
        answer:'Đã vươn lên.'
      },
      {
        prompt:'Lá non làm gì?',
        choices:['Khẽ rung rung.','Rơi xuống đất.'],
        answer:'Khẽ rung rung.'
      },
      {
        prompt:'Vì sao dường như lá muốn cảm ơn bé?',
        choices:['Vì bé đã nhặt và chăm hạt giống.','Vì bé hái lá.'],
        answer:'Vì bé đã nhặt và chăm hạt giống.'
      }
    ]
  },
  matching:[
    {left:'Mầm non', right:'đã vươn lên.'},
    {left:'Lá non', right:'khẽ rung rung.'}
  ],
  writeTargets:['uống','giường','ước','thước'],
  audio:{
    welcome:'Chào con! Hôm nay mình sẽ học ba vần uông, ương và ươc. Mình nghe thật kỹ, ghép theo cụm, rồi đọc câu chuyện Hạt giống nhỏ nhé.',
    uong:'uông',
    uong2:'ương',
    uoc:'ươc',
    compare:'uông, ương, ươc',
    correct:'Đúng rồi! Con tự tìm ra đáp án rất tốt.',
    retry:'Chưa đúng. Con nghe lại phần cuối của tiếng rồi thử một lần nữa nhé.',
    storyIntro:'Con tự đọc câu trước. Khi đọc xong mới bấm nghe cô đọc để kiểm tra.',
    final:'Tuyệt vời! Con đã hoàn thành bài Hạt giống nhỏ.'
  },
  reviewIntervalsHours:[24,72,168],
  ttsTexts:[
    'uông','ương','ươc','uống','giường','ước','thước','xuống','chuông','đường','sương','nước',
    'Một hạt giống nhỏ nằm lặng lẽ bên đường.',
    'Bé nhặt được, đem về thả xuống góc vườn.',
    'Chỉ ít hôm, mầm non đã vươn lên, uống những giọt sương sớm.',
    'Lá non khẽ rung rung.',
    'Dường như lá muốn cảm ơn bé.',
    'Mầm non','đã vươn lên.','Lá non','khẽ rung rung.',
    'Đem về thả xuống góc vườn.','Để lại bên đường.','Đã vươn lên.','Vẫn nằm im.',
    'Khẽ rung rung.','Rơi xuống đất.','Vì bé đã nhặt và chăm hạt giống.','Vì bé hái lá.',
    'Chào con! Hôm nay mình sẽ học ba vần uông, ương và ươc. Mình nghe thật kỹ, ghép theo cụm, rồi đọc câu chuyện Hạt giống nhỏ nhé.',
    'Đúng rồi! Con tự tìm ra đáp án rất tốt.',
    'Chưa đúng. Con nghe lại phần cuối của tiếng rồi thử một lần nữa nhé.',
    'Con tự đọc câu trước. Khi đọc xong mới bấm nghe cô đọc để kiểm tra.',
    'Tuyệt vời! Con đã hoàn thành bài Hạt giống nhỏ.'
  ]
};