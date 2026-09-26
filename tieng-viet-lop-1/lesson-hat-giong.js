window.TV1_LESSON = {
  id: 'tv1-hat-giong-nho',
  title: 'Hạt giống nhỏ',
  subtitle: 'uông · ương · ươc',
  goal: 'Nhận chắc ba vần uông, ương, ươc; tự đánh vần tiếng mới theo công thức âm đầu + vần + thanh; đọc hiểu bài Hạt giống nhỏ mà không học thuộc lòng.',
  principles: [
    'Nhìn cấu tạo trước khi đọc cả tiếng',
    'Tự đánh vần trước, người lớn chỉ sửa sau',
    'Đọc theo cụm nghĩa thay vì kéo từng chữ',
    'Che chữ và nhớ lại để chuyển sang trí nhớ lâu dài'
  ],
  teacherPlan: {
    totalMinutes: 15,
    rule: 'Mỗi lần chỉ sửa một lỗi. Nếu con bí quá 5 giây, gợi ý vần trước rồi để con tự ghép tiếp.',
    phases: [
      {minutes:2, title:'Nhận 3 vần', note:'Chỉ – đọc – che – hỏi lại.'},
      {minutes:4, title:'Đánh vần 4 từ', note:'Vần trước → âm đầu → thanh.'},
      {minutes:3, title:'Phân loại từ', note:'Cho con tự tìm “nhà vần”.'},
      {minutes:4, title:'Đọc đoạn ngắn', note:'Mỗi lần 1 câu, hiểu rồi mới sang câu sau.'},
      {minutes:2, title:'Nhớ lại', note:'Che chữ, hỏi nhanh, dừng khi con còn hứng thú.'}
    ]
  },
  rimes: [
    {id:'uong', text:'uông', body:'uô', ending:'ng', cue:'uô + ng', color:'blue'},
    {id:'uong2', text:'ương', body:'ươ', ending:'ng', cue:'ươ + ng', color:'green'},
    {id:'uoc', text:'ươc', body:'ươ', ending:'c', cue:'ươ + c', color:'orange'}
  ],
  focusWords: [
    {id:'uong-word', word:'uống', onset:'', rime:'uông', tone:'sắc', build:['uông','sắc','uống'], meaning:'uống nước'},
    {id:'giuong', word:'giường', onset:'gi', rime:'ương', tone:'huyền', build:['gi','ương','giương','huyền','giường'], meaning:'cái giường'},
    {id:'uoc-word', word:'ước', onset:'', rime:'ươc', tone:'sắc', build:['ươc','sắc','ước'], meaning:'mong ước'},
    {id:'thuoc', word:'thước', onset:'th', rime:'ươc', tone:'sắc', build:['th','ươc','thươc','sắc','thước'], meaning:'cái thước'}
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
      {
        text:'Một hạt giống nhỏ nằm lặng lẽ bên đường.',
        chunks:['Một hạt giống nhỏ','nằm lặng lẽ','bên đường.'],
        hard:['đường']
      },
      {
        text:'Bé nhặt được, đem về thả xuống góc vườn.',
        chunks:['Bé nhặt được,','đem về','thả xuống góc vườn.'],
        hard:['xuống','vườn']
      },
      {
        text:'Chỉ ít hôm, mầm non đã vươn lên, uống những giọt sương sớm.',
        chunks:['Chỉ ít hôm,','mầm non đã vươn lên,','uống những giọt sương sớm.'],
        hard:['vươn','uống','sương']
      },
      {
        text:'Lá non khẽ rung rung.',
        chunks:['Lá non','khẽ rung rung.'],
        hard:[]
      },
      {
        text:'Dường như lá muốn cảm ơn bé.',
        chunks:['Dường như','lá muốn cảm ơn bé.'],
        hard:['Dường']
      }
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
  reviewIntervalsHours:[24,72,168]
};