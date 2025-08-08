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
                    if (price >= settings.min_sum_lead) {
                        self.crm_post(
                            settings.url + '/check',
                            {
                                code: udsCode,
                                total: price,
                            },
                            function (res) {
                                if (res?.purchase?.points !== undefined && res?.purchase?.points !== null) {
                                    $('.au-result').text('Доступно к списанию: ' + res.purchase.points + ' баллов');
                                    $('.au_container__check').css('display', 'none');
                                    $('.au_container__choice').css('display', 'flex');

                                    $('.au_button__discard').on('click', function () {
                                        self.discardUdsBonus(settings, udsCode, price, res.purchase.points);
                                    });
                                } else {
                                    const errorMessage = res?.message || 'Неизвестная ошибка';
                                    $('.au-result').text('Ошибка: ' + errorMessage);
                                }
                            },
                            'json'
                        );
                    } else {
                        $('.au-result').text('Сумма заказа должна быть больше ' + settings.min_sum_lead + ' руб.');
                    }
                },
                'json'
            );
        }

        this.discardUdsBonus = function (settings, udsCode, total, points) {
            self.crm_post(
                settings.url + '/create',
                {
                    code: udsCode,
                    total: total,
                },
                function (res) {
                    console.log(res)
                    var newPrice = total - points;
                    $.ajax({
                        url: 'https://opt03.amocrm.ru/api/v4/leads/' + AMOCRM.constant('card_id'),
                        method: 'patch',
                        dataType: 'json',
                        data: JSON.stringify({
                            'price': newPrice,
                            'custom_fields_values': [
                                {
                                    'field_id': 509021,
                                    'values': [
                                        {
                                            'value': points
                                        }
                                    ]
                                }
                            ]
                        }),
                        success: function (res) {
                            $('.au_container__choice').css('display', 'none');
                            $('.au_container__success-discard').css('display', 'flex');
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            console.log("Ошибка при обновлении сделки:", textStatus, errorThrown);
                        }
                    });
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