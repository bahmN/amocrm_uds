define(["jquery"], function ($) {
    var CustomWidget = function () {
        var self = this;

        this.checkUdsBonus = function (settings) {
            $('.au-result').css('display', 'flex');
            var udsCode = $('input[name="uds_code"]').val();
            $.get(
                'https://opt03.amocrm.ru/api/v4/leads/' + AMOCRM.constant('card_id'),
                '',
                function (lead) {
                    var price = lead.price;
                    self.crm_post(
                        settings.url + '/check',
                        {
                            code: udsCode,
                            total: price,
                        },
                        function (res) {
                            if (res?.purchase?.points !== undefined && res?.purchase?.points !== null) {
                                $('.au-result').html('Доступно к списанию: <b>' + res.purchase.points + '</b> баллов');
                                $('.au_container__check').css('display', 'none');
                                $('.au_container__choice').css('display', 'flex');
                            } else {
                                const errorMessage = res?.message || 'Неизвестная ошибка';
                                $('.au-result').text('Ошибка: ' + errorMessage);
                            }
                        },
                        'json'
                    );
                },
                'json'
            );
        }

        this.rewardUdsBonus = function () {
            self.crm_post = function () {

            }
        }

        this.callbacks = {
            settings: function () { },
            init: function () {
                $("head").append('<link type="text/css" rel="stylesheet" href="' + self.params.path + '/style.css?v=' + self.get_version() + '">');
                return true;
            },
            bind_actions: function () {
                const settings = self.get_settings();
                if (self.system().area == 'lcard') {
                    const observer = new MutationObserver((mutations, obs) => {
                        const checkButton = document.querySelector('.au_button__check');
                        if (checkButton) {
                            $(checkButton).on('click', () => self.checkUdsBonus(settings));
                            obs.disconnect();
                        }

                        console.log('Элемент не найден');

                    });

                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
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
                            class_name: 'js-au',
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
            advancedSettings: function () { return true },
            destroy: function () { return true },
            onSave: function () { return true },
        };
        return this;
    };
    return CustomWidget;
});