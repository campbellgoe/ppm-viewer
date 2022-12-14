import Head from 'next/head'
import {
  Container,
  Main,
  Title,
  Description,
  CodeTag,
} from '../components/sharedstyles'
import Cards from '../components/cards'
import { useEffect, useRef, useState } from 'react'
import assert from 'assert'


export default function Home() {
  return (
    <Container>
      <Head>
        <title>George's PixMap viewer</title>
        <meta name="description" content="PixMap .ppm viewer" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Main>

        <Description>
          Get started by editing
          <CodeTag>pages/index.tsx</CodeTag>
        </Description>

        <Cards />

        <PPM data={`P3
# example.ppm
4 4
1023
0 0 0 0 0 0 0 0 0 1023 0 1023
0 0 0 0 1023 70 0 0 0 0 0 0
0 0 0 0 0 0 0 1023 70 0 0 0
1023 0 1023 0 0 0 0 0 0 0 0 0`} />
      </Main>
    </Container>
  )
}

function parsePPM(data) {
  const comments = []
  const ppmParser = {
    version: value => {
      assert(value.startsWith('P'), 'Version should start with \'P\'')
      return value
    },
    'width height': wh => {
      try {
        let [width, height] = wh.split(' ')
        width = parseInt(width)
        height = parseInt(height)
        assert(width > 0, 'width must be a non-zero integer')
        assert(height > 0, 'height must be a non-zero integer')
        return [width, height]
      } catch(err){
        assert(!'couldn\'t parse width height', err)
        return [0, 0]
      }
    },
    maxValue: value => {
      const int = parseInt(value)
      assert(Number.isInteger(int), 'maxValue must be an integer')
      return int
    },
    pixels: rgbData => {
      return rgbData.split(' ').map(n => parseInt(n))
    }
  }
  const ppmFormat = ['version', 'width height', 'maxValue', 'pixels']
  const lines = data.split('\n').reduce((acc, line) => {
    // first strip all comments
    if(line.startsWith('#')){
      comments.push(line)
      return acc
    }

    return [...acc, line]
  },[])

  const parsedPpmMap = ppmFormat.reduce((acc, fieldKey, fieldIndex) => {
    if(fieldKey === 'pixels'){
      acc.set(fieldKey, ppmParser[fieldKey](lines.slice(fieldIndex).join(' ')))
    } else {
      acc.set(fieldKey, ppmParser[fieldKey](lines[fieldIndex]))
    }
    return acc
  }, new Map())

  const version = parsedPpmMap.get('version')
  const [width, height] = parsedPpmMap.get('width height')
  const maxValue = parsedPpmMap.get('maxValue')
  const rgbPixels = parsedPpmMap.get('pixels')
  return  {
    version,
    width,
    height,
    maxValue,
    rgbPixels: rgbPixels.map(int => int / maxValue * 255)
  }
}

function drawPPM(ctx, data) {
  const {
    version,
    width,
    height,
    maxValue,
    rgbPixels
  } = parsePPM(data)
    console.log(performance.now(), 'drawing ppm version', version, 'of', width, 'width by', height, 'height in pixels with', maxValue, 'variations per rgb channels')
  
  const cellSize = 10
  ctx.canvas.width = width * cellSize
  ctx.canvas.height = height * cellSize
  let x = 0
  let y = -1
  for(let i = 0, j = 0;i<rgbPixels.length;i+=3, j++){
    const r = rgbPixels[i]
    const g = rgbPixels[i+1]
    const b = rgbPixels[i+2]
    x = j % width
    if(x === 0){
      y ++
    }
    
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`
    ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize)
    
  }
}

function PPM({ data }) {
  const canvasRef = useRef()
  const [firstRender, setFirstRender] = useState(false)
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current as HTMLCanvasElement
      console.log(performance.now(), 'canvas is mounted', canvas)
      console.log(performance.now(), 'data to render:', data)
      const ctx = canvas.getContext('2d')
      try {
        drawPPM(ctx, data)
      } catch(err){
        console.error(err)
      }
    } else {
      setFirstRender(true)
    }
  }, [data, firstRender])
  return (
    <canvas id="ppm-canvas" ref={canvasRef} data-attempted-render-before-mount={firstRender}></canvas>
  )
}