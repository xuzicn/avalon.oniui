
define(['avalon', 'text!./avalon.dropdown.html'], function(avalon, tmpl) {
    var arr = tmpl.split("MS_OPTION_STYLE");
    var cssText = arr[1].replace(/<\/?style>/g, "");
    var styleEl = document.getElementById("avalonStyle");
    var template = arr[0];
    try {
        styleEl.innerHTML += cssText;
    } catch (e) {
        styleEl.styleSheet.cssText += cssText;
    }

    //根据配置中textField及valueField做数据适配
    function modelMatch(model, text, value) {
        avalon.each(model, function(i, item) {
            if(text !== 'text') {
                if(avalon.type(text) === 'function') {
                    item.text = text.call(item, item);
                } else if(text in item) {
                    item.text = item[text];
                } else {
                    throw new Error('textField设置无效！');
                }
            }
            if(value !== 'value') {
                if(value in item) {
                    item.value = item[value];
                } else {
                    throw  new Error('valueField设置无效！');
                }
            }
        });

        return model;
    }

    //提取options中的数据
    function getOption(options) {
        var ret = [];

        avalon.each(options, function(i, option) {
            ret.push({
                text: option.innerHTML,
                value: option.value,
                enable: !option.disabled,
                item: true,
                divider: false,
                optGroup: false
            });
        });

        return ret;
    }

    //提取select中的数据
    function getSource(el) {
        var ret = [],
            groups = el.getElementsByTagName('optgroup'),
            options = el.getElementsByTagName('option');

        if(options.length === 0) {
            return null;
        } else if(groups.length === 0) {
            ret = ret.concat(getOption(options));
        } else {
            avalon.each(groups, function(i, group) {
                var options = group.getElementsByTagName('option');
                if(options.length > 0) {
                    ret.push({
                        text: group.label,
                        enable: !group.disabled,
                        items: false,
                        divider: false,
                        optGroup: true
                    });
                    ret.push({
                        items: false,
                        divider: true,
                        optGroup: false
                    });
                    ret = ret.concat(getOption(options));
                }
            })
        }

        return ret;
    }

    var widget = avalon.ui.dropdown = function(element, data, vmodels) {
        var $element = avalon(element),
            elemParent = element.parentNode,
            options = data.dropdownOptions,
            templates, titleTemplate, listTemplate;

        //将元素的属性值copy到options中
        avalon.each(['autofocus', 'multiple', 'size'], function(i, name) {
            options[name] = element[name];
        });

        options.enable = !element.disabled;

        //读取template
        templates = options.template = options.getTemplate(template).split('MS_OPTION_TEMPLATE');
        titleTemplate = templates[0];
        listTemplate = templates[1];

        //TODO 同步元素的属性到组件中
        var vmodel = avalon.define(data.dropdownId, function(vm) {

            avalon.mix(vm, options);

            vm.$skipArray= ['widgetElement'];
            vm.widgetElement = element;

            //model的获取优先级 表单元素 > options.model.$model > options.model(plan Object)
            vm.model = modelMatch(avalon.mix(true, [], getSource(element) || options.model.$model || options.model || []), options.textFiled, options.valueField);

            //对model的改变做监听，由于无法检测到对每一项的改变，检测数据项长度的改变
            if(options.modleBind && avalon.type(options.model.$watch) === 'function') {
                options.model.$watch('length', function() {
                    avalon.mix(true, vmodel.model, modelMatch(options.model.$model, options.textFiled, options.valueField));
                });
            }

            vm.$init = function() {
                var titleNode, listNode;
                //根据multiple的类型初始化组件
                if(options.multiple) {
                    listNode = avalon.parseHTML(listTemplate);
                    elemParent.insertBefore(listNode, element);
                    avalon(element).css('display', 'none');
                }
                avalon.ready(function() {
                    avalon.scan(elemParent, [vmodel].concat(vmodels));
                });
            };

            vm.$select = function() {};

            vm.$remove = function() {};

        });

        return vmodel;
    };

    widget.version = "1.0";

    widget.defaults = {
        width: null,            //自定义宽度
        listWidth: null,        //自定义下拉列表的宽度
        height: 200,            //下拉列表的高度
        enable: true,           //组件是否可用
        readonly: false,        //组件是否只读
        model: [],            //下拉列表显示的数据模型
        textFiled: 'text',      //模型数据项中对应显示text的字段,可以传function，根据数据源对text值进行格式化
        valueField: 'value',    //模型数据项中对应value的字段
        value: null,            //设置组件的初始值
        label: null,            //设置组件的提示文案，可以是一个字符串，也可以是一个对象
        autofocus: false,       //是否自动获取焦点
        multiple: false,        //是否为多选模式
        size: 1,                //多选模式下显示的条数
        getTemplate: function(str, options) {
            return str
        }
    };

    return avalon;

});