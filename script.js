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
                                    let integerPoints = Math.floor(res.purchase.points)
                                    $('.au-result').text('Доступно к списанию: ' + integerPoints + ' баллов');
                                    $('.au_container__check').css('display', 'none');
                                    $('.au_container__choice').css('display', 'flex');

                                    $('.au_button__discard').on('click', function () {
                                        self.discardUdsBonus(settings, udsCode, price, integerPoints);
                                    });
                                } else {
                                    var errorMessage = res?.message || 'Неизвестная ошибка';
                                    if (errorMessage === 'The page you requested is not found.') {
                                        errorMessage = 'Пользователь с данным кодом на оплату не найден';
                                    }
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
                    $.ajax({
                        url: 'https://opt03.amocrm.ru/api/v4/leads/' + AMOCRM.constant('card_id') + '/notes',
                        method: 'post',
                        dataType: 'json',
                        data: JSON.stringify({
                            'note_type': {
                                "note_type": 'common'
                            },
                            'params':  {
                                "note_type": 'common',
                                "text": '‼️если заказ по акции, не забудьте поставить тег \"Акция\"'
                            }
                        }),
                        success: function (res) {
                            alert('Списано ' + points + ' бонусов')
                            location.reload();
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            console.log("Ошибка при обновлении сделки:", textStatus, errorThrown);
                        }
                    });
                },
                'json'
            );
        }

        this.rewardUdsBonus = function (settings, udsCode, total) {
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
                $.get(
                    'https://opt03.amocrm.ru/api/v4/leads/' + AMOCRM.constant('card_id'),
                    '',
                    function (lead) {
                        let hasDiscount = false;

                        if (lead.custom_fields_values) {
                            const discountField = lead.custom_fields_values.find(field =>
                                field.field_name === "Скидка" || field.field_id === 509021
                            );

                            if (discountField?.values?.[0]?.value && parseFloat(discountField.values[0].value) > 0) {
                                hasDiscount = true;
                            }
                        }

                        var params = {
                            hasDiscount: hasDiscount
                        };

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
                    },
                    'json'
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