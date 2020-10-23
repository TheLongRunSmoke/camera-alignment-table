/**
 * Generate moire table for a film camera alignment.
 * 
 * @author thelongrunsmoke
 */

import './main.css'
import Rect from './rect.js'

const rollButton = document.getElementById('roll')
const aboutButton = document.getElementById('about_button')
const about = document.getElementById('about')
const canvas = document.getElementById('content')
const ctx = canvas.getContext('2d')
const saveButton = document.getElementById('save')
const dataUrlLink = document.getElementById('data_url_link')

/**
 * Initialize window.
 */
let init = () => {
    window.onresize = canvasResize
    canvasResize()
    saveButton.addEventListener('click', save)
    aboutButton.addEventListener('click', (event) => {
        event.stopPropagation()
        toggleAbout()
    })
    hideAbout()
}

/**
 * Keep canvas size coresponding to viewport.
 */
let canvasResize = () => {
    var width = document.documentElement.clientWidth
    var height = document.documentElement.clientHeight
    canvas.width = width
    canvas.height = height
    canvas.style.width = width + "px"
    canvas.style.height = height + "px"
    // Redraw after resize.
    drawTable()
}

/**
 * Toggle visiability of About element.
 */
let toggleAbout = () => {
    about.style.display = (about.style.display == 'none') ? '' : 'none'
}

/**
 * Hide About element, when click outside.
 */
let hideAbout = () => {
    document.onclick = (event) => {
        if (about.style.display == 'none') return
        var path = event.composedPath()
        path.forEach((elm) => {
            if (elm.id == 'about') return
        })
        about.style.display = 'none'
    }
}

/**
 * Offer to save current table to JPEG file.
 */
let save = () => {
    var dataURL = canvas.toDataURL("image/jpeg")
    dataUrlLink.href = dataURL
    dataUrlLink.download = 'camera-alignment-table.jpg'
    dataUrlLink.click()
}

/**
 * Determine line width for pixel-perfect render.
 * 
 * @param {int} value dimension perpendicular to drawing route.
 */
let getPPLineWidth = (value) => {
    return value % 2 ? 3 : 4
}

/**
 * Draw black solid line between given points.
 * 
 * @param {float} fromX
 * @param {float} fromY 
 * @param {float} toX 
 * @param {float} toY 
 */
let drawLine = (fromX, fromY, toX, toY) => {
    ctx.strokeStyle = '#000'
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(toX, toY)
    ctx.stroke()
}

/**
 * Create radial gradient ring in given position.
 * 
 * @param {float} x center on horizontal axis
 * @param {float} y center on vertical axis
 * @param {int} inR internal radius
 * @param {int} outR outer radius
 */
let generateRingGradient = (x, y, inR, outR) => {
    var grd = ctx.createRadialGradient(x, y, inR, x, y, outR)
    return grd
}

/**
 * Draw moire target with radius outR in given place.
 * 
 * @param {float} x center on horizontal axis
 * @param {float} y center on vertical axis
 * @param {float} outR outer radius in px
 * @param {Rect} rect affected rectangle
 */
let drawTargetMoire = (x, y, outR, rect) => {
    var startR = Math.floor(rect.height / 50)
    if (outR / startR < 20) {
        startR = outR / 10
    }
    var curR = startR
    var q = Math.pow(1 / startR, 1 / (outR / 5))
    var step = 1
    while (curR <= outR) {
        var prgValue = startR * Math.pow(q, step - 1)
        if (curR + prgValue > outR) return
        if (prgValue <= 1) break
        if (curR < 5) break
        var grd = generateRingGradient(x, y, curR - 5, curR + prgValue)
        grd.addColorStop(0, "#fff0")
        grd.addColorStop(0.1, "#fff")
        grd.addColorStop(0.45, "#000")
        grd.addColorStop(0.55, "#000")
        grd.addColorStop(0.9, "#fff")
        grd.addColorStop(1, "#fff0")
        ctx.fillStyle = grd
        ctx.fillRect(rect.topLeftX, rect.topLeftY, rect.width, rect.height)
        curR += prgValue
        step++
    }
}

/**
 * Draw chess moire in given area.
 * 
 * @param {Context} ctx canvas drawing context
 * @param {Rect} rect affected rectangle
 */
let drawChessMoire = (ctx, rect) => {
    ctx.strokeStyle = '#000'
    var cellSize = getPPLineWidth(rect.height) * 2
    ctx.lineWidth = cellSize
    ctx.setLineDash([cellSize, cellSize])
    var lineY = cellSize / 2
    var startOffset = 0
    while (lineY <= rect.height) {
        ctx.beginPath()
        ctx.moveTo(rect.topLeftX + startOffset, lineY)
        ctx.lineTo(rect.topLeftX + rect.width, lineY)
        ctx.stroke()
        lineY += cellSize
        startOffset = startOffset == cellSize ? startOffset = 0 : cellSize
    }
}

let drawRect = (fill, rect) => {
    ctx.fillStyle = fill
    ctx.fillRect(rect.topLeftX, rect.topLeftY, rect.width, rect.height)
}

/**
 * Search diameter of a circle inscribed in to rectangle corner like so, on a quarter frame example.
 *    _________________
 *   |--       -`-  | |
 *   |   `-  :     :| X <- return this
 *  b|   / `-  ---  |--
 *   |  R    `      |
 *   |/_\_____:_____|           
 *      |    a 
 *   angle Y 
 *                          _
 *  a = rect.width/2       |  a = X + R cosY            Π             b-a 
 *  b = rect.height/2   => <                    => Y = --- - arsin(- -----)  => X = b - R sinY
 *  R = b                  |_ b = X + R sinY            4              b 
 *                          
 * 
 * @param {Rect} rect frame rectangle
 * @returns {float} diameter of circle inscribed in to corner
 */
let getCornerTargetSize = (rect) => {
    var a = rect.width / 2
    var b = rect.height / 2
    var y = Math.PI / 4 - Math.asin(-(b - a) / b)
    return b - b * Math.sin(y)
}

/**
 * Draw table.
 */
let drawTable = () => {
    // Clear canvas.
    var canvasWidth = ctx.canvas.width
    var canvasHeight = ctx.canvas.height
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    drawRect('#000', new Rect(0, 0, canvasWidth, canvasHeight))
    console.log(canvasWidth, canvasHeight, canvasWidth / 2, canvasHeight / 2)
    // Find common 3:4 frame size and draw borders.
    var frameHeight = canvasHeight
    var frameWidth = Math.floor(frameHeight * 4 / 3)
    var borderWidth = Math.floor((canvasWidth - frameWidth) / 2)
    console.log(frameWidth, frameHeight, borderWidth)
    var frameRect = new Rect(borderWidth, 0, frameWidth, canvasHeight)
    drawRect('#fff', frameRect)
    // Draw chess on whole frame.
    drawChessMoire(ctx, frameRect)
    // Draw center moire target.
    drawTargetMoire(frameRect.topLeftX + frameRect.width / 2, frameRect.height / 2, frameRect.height / 2, frameRect)
    // Find position for corner targets and draw it.
    var cornerTargetRad = getCornerTargetSize(frameRect) / 2
    drawTargetMoire(frameRect.topLeftX + cornerTargetRad, frameRect.topLeftY + cornerTargetRad, cornerTargetRad, frameRect)
    drawTargetMoire(frameRect.topLeftX + frameRect.width - cornerTargetRad,
        frameRect.topLeftY + cornerTargetRad,
        cornerTargetRad,
        frameRect)
    drawTargetMoire(frameRect.topLeftX + cornerTargetRad, frameRect.topLeftY + frameRect.height - cornerTargetRad, cornerTargetRad, frameRect)
    drawTargetMoire(frameRect.topLeftX + frameRect.width - cornerTargetRad,
        frameRect.topLeftY + frameRect.height - cornerTargetRad,
        cornerTargetRad,
        frameRect)
    // Draw horizontal lines.
    ctx.lineWidth = getPPLineWidth(frameRect.height)
    drawLine(frameRect.topLeftX, frameRect.height / 2, frameRect.topLeftX + frameRect.width, frameRect.height / 2)
    drawLine(frameRect.topLeftX,
        frameRect.topLeftY + cornerTargetRad,
        frameRect.topLeftX + frameRect.width,
        frameRect.topLeftY + cornerTargetRad)
    drawLine(frameRect.topLeftX,
        frameRect.topLeftY + frameRect.height - cornerTargetRad,
        frameRect.topLeftX + frameRect.width,
        frameRect.topLeftY + frameRect.height - cornerTargetRad)
    // Draw vertical lines
    ctx.lineWidth = getPPLineWidth(frameWidth)
    drawLine(frameRect.topLeftX + frameRect.width / 2, frameRect.topLeftY, frameRect.topLeftX + frameRect.width / 2, frameRect.height)
    drawLine(frameRect.topLeftX + cornerTargetRad,
        frameRect.topLeftY,
        frameRect.topLeftX + cornerTargetRad,
        frameRect.height)
    drawLine(frameRect.topLeftX + frameRect.width - cornerTargetRad,
        frameRect.topLeftY,
        frameRect.topLeftX + frameRect.width - cornerTargetRad,
        frameRect.height)
}

init()