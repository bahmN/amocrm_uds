define(["jquery"], function ($) {
    var CustomWidget = function () {
        var self = this;

        this.checkUdsBonus = function () {
            self.crm_post(
                'https://xn--b1ag1aakjpl.xn--p1ai/uds/check',
                {
                },
                function (msg) {
                    console.log(msg)
                },
                'json'
            );
        }

        this.callbacks = {
            settings: function () { },
            init: function () {
                $("head").append('<link type="text/css" rel="stylesheet" href="' + self.params.path + '/style.css?v=' + self.get_version() + '">');
                return true;
            },
            bind_actions: function () {
                if (self.system().area == 'lcard') {
                    $('.au_form__button').on('click', function () {
                        self.checkUdsBonus();
                    });
                }

                return true;
            },
            render: function () {
                var params = {};

                var callback = function (template) {
                    var markup = template.render(params);
                    self.render_template({
                        caption: {
                            class_name: 'js-ac-caption',
                            html: ''
                        },
                        body: '',
                        render: markup,
                    });
                };

                self.render({
                    href: '/templates/template.twig',
                    base_path: self.params.path,
                    load: callback 
                },
                    params
                );
                return true;
            },
            dpSettings: function () { },
            advancedSettings: function () { },
            destroy: function () { },
            onSave: function () { },
        };
        return this;
    };
    return CustomWidget;
});