// Illustrative fixtures only; these are not live opening times or travel recommendations.
const area = { country:'KR', city:'seoul', district:'seongsu' };
const point = (id, ko, en) => ({ id, text:{ko,en} });
export const catalog = [
  {
    id:'forest-walk', versionId:'forest-walk-v1', version:1, sourceLocale:'ko', sourceType:'first_hand', growth:'sprout',
    author:'야모', region:area, category:'walk', transport:'walk', durationMinutes:30, cost:{amount:0,currency:'KRW'},
    title:{ko:'서울숲 느긋한 산책',en:'A gentle walk in Seoul Forest'},
    description:{ko:'서두르지 않고 숲의 작은 풍경을 발견하는 30분.',en:'Slow down and notice the small details of the forest.'},
    place:{ko:'서울숲 · 정문에서 시작',en:'Seoul Forest · Start at the main entrance'},
    tip:{ko:'편한 신발과 물을 준비해요. 현장 안내와 출입 가능 구역을 확인하세요.',en:'Bring water and comfortable shoes. Follow on-site signs and access rules.'},
    points:[point('walk','숲길 따라 천천히 걷기','Take a slow walk along the paths'),point('rest','연못 앞에서 잠시 쉬기','Pause beside the pond'),point('scene','마음에 드는 풍경 남기기','Capture a view you like')],
  },
  {
    id:'cafe-hour',versionId:'cafe-hour-v1',version:1,sourceLocale:'ko',sourceType:'ai_draft',growth:'seed',
    author:'Yamone Demo',region:area,category:'cafe',transport:'walk',durationMinutes:60,cost:{amount:6500,currency:'KRW'},
    title:{ko:'성수 골목 카페 한 시간',en:'An hour at a Seongsu café'},
    description:{ko:'골목에서 마음에 드는 카페를 골라 잠시 쉬어가요.',en:'Choose a café in the neighborhood and take a break.'},
    place:{ko:'성수동 · 카페는 직접 선택',en:'Seongsu · Choose a café yourself'},
    tip:{ko:'예시 비용이며 실제 메뉴·영업 여부는 직접 확인해 주세요.',en:'The cost is illustrative. Check the actual menu and opening hours.'},
    points:[point('choose','메뉴를 보고 음료 고르기','Choose a drink from the menu'),point('rest','잠시 앉아 여행 메모 남기기','Sit down and write a travel note')],
  },
  {
    id:'alley-photo',versionId:'alley-photo-v1',version:1,sourceLocale:'en',sourceType:'first_hand',growth:'sprout',
    author:'Mina',region:area,category:'sightseeing',transport:'walk',durationMinutes:30,cost:{amount:0,currency:'KRW'},
    title:{ko:'골목에서 사진 남기기',en:'Neighborhood photo moments'},
    description:{ko:'걷다가 발견한 색과 질감을 기억해 보세요.',en:'Notice the colors and textures you find on your walk.'},
    place:{ko:'성수동 · 공개된 보행 구역',en:'Seongsu · Public pedestrian areas'},
    tip:{ko:'사유지에 들어가지 말고 타인의 얼굴이 드러나는 사진은 피해주세요.',en:'Stay out of private property and avoid identifiable photos of other people.'},
    points:[point('color','마음에 드는 색 찾기','Find a color you like'),point('detail','건물의 작은 디테일 보기','Notice an architectural detail'),point('note','가장 좋았던 장면 적기','Describe your favorite scene')],
  },
  {
    id:'rest-stop',versionId:'rest-stop-v1',version:1,sourceLocale:'ko',sourceType:'ai_draft',growth:'seed',
    author:'Yamone Demo',region:area,category:'walk',transport:'walk',durationMinutes:20,cost:{amount:0,currency:'KRW'},
    title:{ko:'산책 사이 작은 쉼표',en:'A small break between walks'},
    description:{ko:'벤치에 앉아 잠시 쉬고 다음 경험을 골라요.',en:'Find a public bench, take a break and choose your next experience.'},
    place:{ko:'성수동 · 이용 가능한 공공 휴식 공간',en:'Seongsu · An available public rest area'},
    tip:{ko:'공간의 이용 규칙을 확인하고 통행을 방해하지 않아요.',en:'Follow local rules and keep walkways clear.'},
    points:[point('rest','앉아서 잠깐 쉬기','Sit down and rest'),point('next','다음 경험 한 가지 고르기','Choose your next experience')],
  },
];
