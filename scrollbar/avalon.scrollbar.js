/**
  * scrollbar组件，
  *
  */
define(["avalon", "text!./avalon.scrollbar.html", "text!./avalon.scrollbar.css", "draggable/avalon.draggable"], function(avalon, tmpl, css) {

    var cssText = css
    var styleEl = document.getElementById("avalonStyle")
    var template = tmpl
    try {
        styleEl.innerHTML += cssText
    } catch (e) {
        styleEl.styleSheet.cssText += cssText
    }

    // get by className, not strict
    function getByClassName(cname, par) {
        var par = par || document.body
        if(par.getElementsByClassName) {
            return par.getElementsByClassName(cname)
        } else {
            var child = par.getElementsByTagName("*"),
                arr = []
            avalon.each(child, function(i, item) {
                var ele = avalon(item)
                if(ele.hasClass(cname)) arr.push(item)
            })
            return arr
        }
    }

    // 响应wheel,binded
    var wheelBinded,
        wheelArr = [],
        keyArr = []

    var widget = avalon.ui.scrollbar = function(element, data, vmodels) {
        var options = data.scrollbarOptions
        //方便用户对原始模板进行修改,提高定制性
        options.template = options.getTemplate(template, options)

        var vmodel = avalon.define(data.scrollbarId, function(vm) {
            avalon.mix(vm, options)
            vm.widgetElement = element
            vm.draggerHeight = vm.draggerWidth = ""
            vm.inFocuse = false
            vm.$position = []
            vm.viewElement = element

            var inited,
                bars = [],
                scroller
            vm.$init = function() {
                if(inited) return
                inited = true
                vmodel.widgetElement.style.position = "relative"
                //document body情形需要做一下修正
                vmodel.viewElement = vmodel.widgetElement == document.body ? document.getElementsByTagName(
                    "html")[0] : vmodel.widgetElement
                vmodel.viewElement.style.overflow = "hidden"
                vmodel.$position = vmodel.position.split(",")

                var frag = avalon.parseHTML(options.template)
                vmodel.widgetElement.appendChild(frag)
                avalon.scan(element, [vmodel].concat(vmodels))
                var children = vmodel.widgetElement.childNodes
                avalon.each(children, function(i, item) {
                    var ele = avalon(item)
                    if(ele.hasClass("ui-scrollbar")) {
                        bars.push(ele)
                    } else if(ele.hasClass("ui-scrollbar-scroller")) {
                        scroller = ele
                    }
                })
                // 竖直方向支持滚轮事件
                if(vmodel.position.match(/left|right/g)) {
                    var vs = [],hs = []
                    avalon.each(vmodel.$position, function(i, item) {
                        if(item.match(/left|right/g)) {
                            vs.push([i, item])
                        } else {
                            hs.push([i, item])
                        }
                    })

                    function wheelLike(diretion, arr, e, func) {
                        avalon.each(arr, function(i, item) {
                            if(!bars[i].data("ui-scrollbar-needed")) return
                            vmodel.$computer(func || function(obj) {
                                return vmodel.$clickComputer(obj, diretion)
                            }, item[0], item[1], function(breakOut) {
                                if(!breakOut) e.preventDefault()
                            })
                        })
                    }

                    function myOnWheel(e) {
                        if(vmodel.inFocuse) {
                            wheelLike(e.wheelDelta > 0 ? "up" : "down", vs, e)
                        }
                    }
                    function myKeyDown(e) {
                        var k = e.keyCode
                        if(k > 32 && k < 41 & vmodel.inFocuse) {
                            // 方向按键
                            if(k in {37:1, 39: 1, 38: 1, 40:1}) {
                                wheelLike(k in {37:1, 38:1} ? "up" : "down", k in {38: 1, 40:1} ? vs : hs, e)
                            // end or home
                            // pageup or pagedown
                            } else{
                                var diretion = k in {33: 1, 36: 1} ? "up" : "down"
                                wheelLike(diretion, vs, e, function(obj) {
                                    var _top = -(parseInt(scroller.css("top"))) >> 0
                                    // home, pageup
                                    if(k in {33: 1, 36: 1}) {
                                        if(_top) e.preventDefault()
                                    // end, pagedown
                                    } else {
                                        if(_top < obj.scrollerH - obj.viewH) event.preventDefault()
                                    }
                                    // home or end
                                    if(k in {36: 1, 35: 1}) {
                                        return {
                                            x: 0,
                                            y: k == 36 ? 0 : obj.draggerparHeight - obj.draggerHeight
                                        }
                                    // pageup or pagedown
                                    // a frame
                                    } else {
                                        return vmodel.$clickComputer(obj, diretion, obj.draggerHeight)
                                    }
                                })
                            }
                        }
                    }
                    // document.body直接如此处理
                    if(vmodel.widgetElement == document.body) {
                        vmodel.inFocuse = true
                        wheelArr.push(myOnWheel)
                        keyArr.push(myKeyDown)
                    } else {
                        avalon.bind(element, "mouseenter", function(e) {
                            vmodel.inFocuse = true
                            wheelArr.push(myOnWheel)
                            keyArr.push(myKeyDown)
                        })
                        avalon.bind(element, "mouseleave", function(e) {
                            vmodel.inFocuse = false
                            for(var i = 0, len = wheelArr.length; i < len; i++) {
                                if(wheelArr[i] === myOnWheel) {
                                    wheelArr.splice(i, 1)
                                    keyArr.splice(i, 1)
                                    break
                                }
                            }
                        })
                    }
                    // 所有组件实例公用一个事件绑定
                    if(!wheelBinded) {
                        wheelBinded = true
                        avalon.bind(document, "mousewheel", function(e) {
                            var cb = wheelArr[wheelArr.length - 1]
                            cb && cb(e)
                        })
                        // keyborad,,,simida
                        // left 37
                        // right 39
                        // top 38
                        // down 40
                        // pageup 33
                        // pagedown 34
                        // home 36
                        // end 35
                        avalon.bind(document, "keydown", function(e) {
                           var cb = keyArr[keyArr.length - 1]
                            cb && cb(e)
                        })
                    }

                }


                avalon.bind(element, "mouseenter", function() {
                    avalon.each(bars, function(i, item) {
                        vmodel.$show("e", false, item)
                    })
                })
                avalon.bind(element, "mouseleave", function() {
                    vmodel.$hide()
                })

                vmodel.update("init")
            }

            vm.beforeStartFn = avalon.noop

            vm.startFn = avalon.noop

            vm.dragFn = function(e, data) {
                var dr = avalon(data.element)
                vmodel.$computer(function(obj) {
                    return {
                        x: parseInt(dr.css("left")) >> 0,
                        y: parseInt(dr.css("top")) >> 0
                    }
                }, dr.attr("ui-scrollbar-index"), dr.attr("ui-scrollbar-pos"))
            }

            vm.beforeStopFn = avalon.noop

            vm.stopFn = function(e, data) {
                vmodel.dragFn(e, data)
                avalon(data.element).removeClass("ui-scrollbar-dragger-onmousedown")
            }
            vm.$remove = function() {
                avalon.each(bars, function(i, bar) {
                    bar[0] && bar[0].parentNode && bar[0].parentNode.removeChild(bar)
                })
            }

            vm._onScroll = function() {
                if(vmodel.show != "scrolling") return     
                avalon.each(bars, function(i, item) {
                    vmodel.$show("e", false, item)
                })
            }
            vm.$show = function(e, always, index) {
                if(vmodel.show != "scrolling") return
                e.stopPropagation && e.stopPropagation()
                var item = index.css ? index : bars[index]
                if(item) {
                    clearTimeout(item.data("ui-scrollbar-hidetimer"))
                    item.css("visibility", "visible")
                    item.css("opacity", 1)
                    if(!always) {
                        item.data("ui-scrollbar-hidetimer", setTimeout(function() {
                            item.css("opacity", 0)
                        }, 700))
                    }
                }
            }
            vm.$hide = function(e,index) {
                if(vmodel.show != "scrolling") return
                if(index && bars[index]) {
                    bars[index].css("opacity", 0)
                } else {
                    avalon.each(bars, function(i, item) {
                        item.css("opacity", 0)
                    })
                }
            }
            //@method update()更新滚动条状态，windowresize，内容高度变化等情况下调用，不能带参数
            vm.update = function(ifInit, x, y) {
                var ele = avalon(vmodel.viewElement),
                    // 滚动内容宽高
                    viewW = scroller.innerWidth(),
                    viewH = scroller.innerHeight(),
                    // 滚动视野区宽高
                    h = ele.innerHeight(),
                    w = ele.innerWidth(),
                    p = vmodel.position,
                    barDictionary = {
                        "top": p.match(/top/g) && viewW > w,
                        "right": p.match(/right/g) && viewH > h,
                        "bottom": p.match(/bottom/g) && viewW > w,
                        "left": p.match(/left/g) && viewH > h
                    },
                    barMinus = {},
                    y = y == void 0 ? vmodel.scrollTop : y,
                    x = x == void 0 ? vmodel.scrollLeft : x
                // if(vmodel.showBarHeader && bars.length > 1) {
                if(bars.length > 1) {
                    var ps = ["top", "right", "bottom", "left"]
                    for(var i = 0; i < 4; i++) {
                        barMinus[ps[i]] = [(barDictionary[i ? ps[i - 1] : ps[3]] && 1) >> 0, (barDictionary[i < 3 ? ps[i + 1] : ps[0]] && 1) >> 0]
                        if(i > 1) barMinus[ps[i]] = barMinus[ps[i]].reverse()
                    }
                }
                //document body情形需要做一下修正
                if(vmodel.viewElement != vmodel.widgetElement) {
                    p.match(/right|left/g) && avalon(vmodel.widgetElement).css("height", avalon(vmodel.viewElement).height() + "px")
                }
                avalon.each(vmodel.$position, function(i, item) {
                    var bar = bars[i]
                    // hidden bar
                    if(!barDictionary[item]) {
                        if(bar) {
                            bar.css("opacity", 0)
                            bar.css("visibility", "hidden")
                            bar.data("ui-scrollbar-needed", false)
                        }
                        return
                    } else {
                        if(bar) {
                            bar.data("ui-scrollbar-needed", true)
                            bar.css("visibility", "visible")
                            if(vmodel.show == "scrolling" || vmodel.show == "never"){
                                bar.css("opacity", 0)
                            } else {
                                bar.css("opacity", 1)
                            }
                        }
                    }
                    if(bar) {
                        var bh = sh = bar.height(),
                            bw = sw = bar.width(),
                            dragger = avalon(getByClassName("ui-scrollbar-dragger", bar.element)[0]),
                            isVertical = item.match(/left|right/),
                            draggerpar = avalon(getByClassName("ui-scrollbar-draggerpar", bar[0])[0]),
                            headerLength = vmodel.showBarHeader ? 2 : 0
                        // 更新滚动条没有两端的箭头的时候依旧要重新计算相邻两个bar的间隔
                        var draggerParCss = []
                        if(bars.length > 1) {
                            var barCss = [], minus = barMinus[item]
                            if(isVertical) {
                                barCss = [
                                    ["top", minus[0] * bw + "px"],
                                    ["height", (h - bw * (minus[0] + minus[1])) + "px"]
                                ]
                                draggerParCss = [
                                    ["top", (headerLength/2) * bw + "px"],
                                    ["height", (h - bw * (minus[0] + minus[1] + headerLength)) + "px"]
                                ]
                            } else {
                                barCss = [
                                    ["left", minus[0] * bh + "px"],
                                    ["width", (w - bh * (minus[0] + minus[1])) + "px"]
                                ]
                                draggerParCss = [
                                    ["left", (headerLength/2) * bh + "px"],
                                    ["width", (w - bh * (headerLength + minus[0] + minus[1])) + "px"]
                                ]
                            }
                            avalon.each(barCss, function(index, css) {
                                bar.css.apply(bar, css)
                            })
                            bh = bar.height()
                            bw = bar.width()
                        } else {
                            if(isVertical) {
                                draggerParCss = [
                                    ["top", bw + "px"],
                                    ["height", (h - bw * 2) + "px"]
                                ]
                            } else {
                                draggerParCss = [
                                    ["left", bh + "px"],
                                    ["width", (w - bh * 2) + "px"]
                                ]
                            }
                        }
                        avalon.each(draggerParCss, function(index, css) {
                            draggerpar.css.apply(draggerpar, css)
                        })
                        sh = bh - headerLength * bw
                        sw = bw - headerLength * bh
                        // 更新滚动头
                        var draggerCss
                        if(isVertical) {
                            var draggerTop = y,
                                draggerHeight = h * sh / viewH
                                draggerTop = draggerTop < 0 ? 0 : draggerTop
                                draggerTop = draggerTop > viewH - h ? viewH - h : draggerTop
                                draggerTop = sh * draggerTop / viewH
                            draggerCss = [
                                ["width", "100%"],
                                ["height", draggerHeight + "px"],
                                ["top", draggerTop + "px"]
                            ]
                            y = y > 0 ? (y > viewH - h ?  viewH - h : y) : 0
                        } else {
                            var draggerLeft = x,
                                draggerWidth = w * sw / viewW
                                draggerLeft = draggerLeft < 0 ? 0 : draggerLeft
                                draggerLeft = draggerLeft > viewW - w ? viewW - w : draggerLeft
                                draggerLeft = sw * draggerLeft / viewW
                            draggerCss = [
                                ["height", "100%"],
                                ["width", draggerWidth + "px"],
                                ["left", draggerLeft + "px"]
                            ]
                            x = x > 0 ? (x > viewW - w ? viewW - w : x) : 0
                        }
                        avalon.each(draggerCss, function(index, css) {
                            dragger.css.apply(dragger, css)
                        })
                        if(ifInit) {
                            dragger.attr("ms-draggable", "")
                            dragger.attr("ui-scrollbar-pos", item)
                            dragger.attr("ui-scrollbar-index", i)
                            avalon.scan(dragger[0], vmodel)
                        }
                        if(isVertical) {
                            vmodel.$scrollTo(void 0, y)
                        } else {
                            vmodel.$scrollTo(x, void 0)
                        }
                        if(vmodel.showBarHeader) {
                            if(y == 0 && isVertical || !isVertical && x == 0) {
                                avalon(getByClassName("ui-scrollbar-arrow-up", bar[0])[0]).addClass("ui-scrollbar-arrow-disabled")
                            } else {
                                avalon(getByClassName("ui-scrollbar-arrow-up", bar[0])[0]).removeClass("ui-scrollbar-arrow-disabled")
                            }
                            if(y >= draggerpar.innerHeight() - dragger.innerHeight() && isVertical || !isVertical && x >= draggerpar.innerWidth() - dragger.innerWidth()) {
                                avalon(getByClassName("ui-scrollbar-arrow-down", bar[0])[0]).addClass("ui-scrollbar-arrow-disabled")
                            } else {
                                avalon(getByClassName("ui-scrollbar-arrow-down", bar[0])[0]).removeClass("ui-scrollbar-arrow-disabled")
                            }
                        }
                    }
                })
            }

            // 点击箭头
            vm.$arrClick = function(e, diretion, position, barIndex) {
                vmodel.$computer(function(obj) {
                    return vmodel.$clickComputer(obj, diretion)
                }, position, barIndex)
            }

            vm.$clickComputer = function(obj, diretion, step) {
                var step = step || obj.step || 40,
                    l = parseInt(obj.dragger.css("left")) >> 0,
                    r = parseInt(obj.dragger.css("top")) >> 0,
                    x = diretion == "down" ? l + step : l - step,
                    y = diretion == "down" ? r + step : r - step
                return {
                    x: x,
                    y: y
                }
            }
            // 长按
            vm.$arrDown = function($event, diretion, position, barIndex,ismouseup) {
                var se = this,
                    ele = avalon(se)
                clearInterval(ele.data("mousedownTimer"))
                clearTimeout(ele.data("setTimer"))
                var bar = bars[barIndex]
                if(ismouseup || ele.hasClass("ui-scrollbar-arrow-disabled")) {
                    return ele.removeClass("ui-scrollbar-arrow-onmousedown")
                }
                // 延时开启循环
                ele.data("setTimer", setTimeout(function(){
                    ele.addClass("ui-scrollbar-arrow-onmousedown")
                    ele.data("mousedownTimer", setInterval(function() {
                        return vmodel.$computer(function(obj) {
                                return vmodel.$clickComputer(obj, diretion)
                            }, barIndex, position ,function(breakOut) {
                                if(!breakOut) return
                                clearInterval(ele.data("mousedownTimer"))
                                clearTimeout(ele.data("setTimer"))
                            })
                    }, 120))
                }, 10))
            }
            // 点击滚动条
            vm.$barClick = function(e, position, barIndex) {
                var ele = avalon(this)
                if(ele.hasClass("ui-scrollbar-dragger")) return
                vmodel.$computer(function(obj) {
                    return {
                        x: e.pageX - obj.offset.left - obj.draggerWidth / 2,
                        y : e.pageY - obj.offset.top - obj.draggerHeight / 2
                    }
                }, barIndex, position)
            }
            // 计算滚动条位置
            vm.$computer = function(axisComputer, barIndex, position, callback) {
                var bar = bars[barIndex]
                if(bar) {
                    var obj = {},
                        isVertical = position.match(/left|right/g)
                    obj.dragger = avalon(getByClassName("ui-scrollbar-dragger", bar[0])[0])
                    obj.draggerWidth = obj.dragger.innerWidth()
                    obj.draggerHeight = obj.dragger.innerHeight()
                    obj.draggerpar = avalon(obj.dragger[0].parentNode)
                    obj.draggerparWidth = obj.draggerpar.innerWidth()
                    obj.draggerparHeight = obj.draggerpar.innerHeight()
                    obj.offset = obj.draggerpar.offset()
                    obj.up = avalon(getByClassName("ui-scrollbar-arrow-up", bar[0])[0])
                    obj.down = avalon(getByClassName("ui-scrollbar-arrow-down", bar[0])[0])
                    obj.viewer = avalon(vmodel.viewElement)
                    obj.viewH = obj.viewer.innerHeight()
                    obj.viewW = obj.viewer.innerWidth()
                    obj.scrollerH = scroller.innerHeight()
                    obj.scrollerW = scroller.innerWidth()
                    obj.step = isVertical ? 40 * (obj.draggerparHeight - obj.draggerHeight) / obj.scrollerH : 40 * (obj.draggerparWidth - obj.draggerWidth) / obj.scrollerW

                    var xy = axisComputer(obj),
                        breakOut

                    if(isVertical) {
                        if(xy.y < 0) {
                            xy.y = 0
                            obj.up.addClass("ui-scrollbar-arrow-disabled")
                            breakOut = ["v", "up"]
                        } else {
                            obj.up.removeClass("ui-scrollbar-arrow-disabled")
                        }
                        if(xy.y > obj.draggerparHeight - obj.draggerHeight) {
                            xy.y = obj.draggerparHeight - obj.draggerHeight
                            breakOut = ["v", "down"]
                            obj.down.addClass("ui-scrollbar-arrow-disabled")
                        } else {
                            obj.down.removeClass("ui-scrollbar-arrow-disabled")
                        }
                        obj.dragger.css("top", xy.y + "px")
                        vmodel.$scrollTo(void 0, (obj.scrollerH - obj.viewH) * xy.y / (obj.draggerparHeight - obj.draggerHeight))
                    } else {
                        if(xy.x < 0) {
                            xy.x = 0
                            breakOut = ["h", "up"]
                            obj.up.addClass("ui-scrollbar-arrow-disabled")
                        } else {
                            obj.up.removeClass("ui-scrollbar-arrow-disabled")
                        }
                        if(xy.x > obj.draggerparWidth - obj.draggerWidth) {
                            xy.x = obj.draggerparWidth - obj.draggerWidth
                            breakOut = ["h", "down"]
                            obj.down.addClass("ui-scrollbar-arrow-disabled")
                        } else {
                            obj.down.removeClass("ui-scrollbar-arrow-disabled")
                        }
                        obj.dragger.css("left", xy.x + "px")
                        vmodel.$scrollTo((obj.scrollerW - obj.viewW) * xy.x / (obj.draggerparWidth - obj.draggerWidth), void 0)
                    }

                }
                // 回调，溢出检测
                callback && callback(breakOut)
            }
            vm.$scrollTo = function(x, y) {
                if(x != void 0) vmodel.scrollLeft = x
                if(y != void 0) vmodel.scrollTop = y// 更新视窗
                if(y != void 0) {
                    scroller[0].style.top = -vmodel.scrollTop + "px"
                } else if(x != void 0) {
                    scroller[0].style.left = -vmodel.scrollLeft + "px"
                }
            }

            //@method scrollTo(x,y) 滚动至 x,y
            vm.scrollTo = function(x, y) {
                vmodel.update(false, x, y)
            }

            vm.$initWheel = function(e, type) {
                if(type == "enter") {
                    vmodel.inFocuse = true
                } else {
                    vmodel.inFocuse = false
                }
            }
            vm.$draggerDown = function(e, isdown) {
                var ele = avalon(this)
                if(isdown) {
                    ele.addClass("ui-scrollbar-dragger-onmousedown")
                } else {
                    ele.removeClass("ui-scrollbar-dragger-onmousedown")
                }
            }
            vm.$stopPropagation = function(e) {
                e.stopPropagation()
            }
        })
      
        vmodel.$watch("scrollLeft", function(newValue, oldValue) {
            vmodel._onScroll()
            vmodel.onScroll && vmodel.onScroll(newValue, oldValue, "h", vmodel)
        })
        vmodel.$watch("scrollTop", function(newValue, oldValue) {
            vmodel._onScroll()
            vmodel.onScroll && vmodel.onScroll(newValue, oldValue, "v", vmodel)
        })

        return vmodel
    }
    //add args like this:
    //argName: defaultValue, \/\/@param description
    //methodName: code, \/\/@optMethod optMethodName(args) description 
    widget.defaults = {
        position: "right", //@param scrollbar出现的位置,right右侧，left左侧，top上侧，bottom下侧，可能同时出现多个方向滚动条
        scrollTop: 0, //@param 竖直方向滚动初始值，负数会被当成0，设置一个极大值等价于将拖动头置于bottom
        scrollLeft: 0, //@param 水平方向滚动初始值，负数会被当成0处理，极大值等价于拖动头置于right
        show: "always", //@param never一直不可见，scrolling滚动和hover时候可见，always一直可见
        showBarHeader: true,//@param 是否显示滚动条两端的上下箭头
        draggerHTML: "", //@param 滚动条拖动头里，注入的html碎片
        getTemplate: function(tmpl, opts) {
            return tmpl
        },
        onScroll: function(newValue, oldValue, diretion, vmodel) {

        },//@optMethod 滚动回调,scrollLeft or scrollTop变化的时候触发，参数为newValue, oldValue, diretion, vmodel diretion = h 水平方向，= v 竖直方向
        type: "normal", //@param srollbar size,normal为10px，small为8px，large为14px
        $author: "skipper@123"
    }
})