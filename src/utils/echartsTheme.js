export const BlackGoldTheme = {
  color: ['#ffd24d','#67c23a','#409eff','#e6a23c','#f56c6c'],
  backgroundColor: 'transparent',
  textStyle: { color:'#e9e9ea' },
  title: { textStyle: { color:'#ffd24d', fontWeight:'bold' } },
  legend:{ textStyle:{ color:'#cfcfd4' } },
  tooltip:{ backgroundColor:'#151518', borderColor:'rgba(255,255,255,.1)', textStyle:{ color:'#e9e9ea' } },
  grid:{ left:20, right:20, top:30, bottom:20, containLabel:true },
  xAxis:{
    axisLine:{ lineStyle:{ color:'rgba(255,255,255,.25)' } },
    axisLabel:{ color:'#cfcfd4' },
    splitLine:{ show:true, lineStyle:{ color:'rgba(255,255,255,.06)' } }
  },
  yAxis:{
    axisLine:{ lineStyle:{ color:'rgba(255,255,255,.25)' } },
    axisLabel:{ color:'#cfcfd4' },
    splitLine:{ show:true, lineStyle:{ color:'rgba(255,255,255,.06)' } }
  },
  series:[ { smooth:true, lineStyle:{ width:2 } } ]
}
