define(["jquery"], function ($) {
    const CustomWidget = function () {
        const self = this;

        this.checkUdsBonus = function (settings) {
            $('.au-result').css('display', 'flex');
            $.get(
                'https://opt03.amocrm.ru/api/v4/leads/' + AMOCRM.constant('card_id'),
                '',
                function (lead) {
                    const udsCode = $('input[name="uds_code"]').val();
                    const inputPrice = parseInt($('input[name="sum_order"]').val(), 10);
                    let price = parseInt(lead.price, 10) || 0;
                    const minSum = parseInt(settings.min_sum_lead, 10);

                    if (Number.isInteger(inputPrice) && inputPrice > 0) {
                        price = inputPrice;
                    }

                    console.log(inputPrice);
                    console.log(price);

                    if (price >= minSum) {
                        self.crm_post(
                            settings.url + '/check',
                            {
                                code: udsCode,
                                total: price,
                            },
                            function (res) {
                                if ((res?.purchase?.points !== undefined && res?.purchase?.points !== null) ||
                                    (res?.purchase?.certificatePoints !== undefined && res?.purchase?.certificatePoints !== null)
                                ) {
                                    let integerPoints = Math.floor(res.purchase.points || res.purchase.certificatePoints || 0);

                                    $('.au-result').text('Доступно к списанию: ' + integerPoints + ' баллов');
                                    $('.au_container__check').css('display', 'none');
                                    $('.au_container__choice').css('display', 'flex');
                                    $('.au_button__reward').on('click', function () {
                                        self.rewardUdsBonus(settings, udsCode, price);
                                    });

                                    if (integerPoints > 0) {
                                        $('.au_button__discard').on('click', function () {
                                            self.discardUdsBonus(settings, udsCode, price, integerPoints);
                                        });
                                    } else {
                                        $('.au_button__discard').css('display', 'none');
                                    }
                                } else {
                                    const errorMessage = res?.message || 'Неизвестная ошибка';
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
                    if (res.state === 'NORMAL') {
                        $.ajax({
                            url: 'https://opt03.amocrm.ru/api/v4/leads/' + AMOCRM.constant('card_id') + '/notes',
                            method: 'post',
                            dataType: 'json',
                            data: JSON.stringify({
                                'note_type': {
                                    "note_type": 'common'
                                },
                                'params': {
                                    "note_type": 'common',
                                    "text": '⚠️Списаны баллы UDS, в размере: ' + points + ' баллов.'
                                }
                            }),
                            success: function (res) {
                                location.reload();
                            },
                            error: function (jqXHR, textStatus, errorThrown) {
                                console.log("Ошибка при обновлении сделки:", textStatus, errorThrown);
                            }
                        });
                    } else {
                        alert('Баллы не были списаны. Причина: ' + res);
                    }
                },
                'json'
            );
        }

        this.rewardUdsBonus = function (settings, udsCode, total) {
            self.crm_post(
                settings.url + '/reward',
                {
                    code: udsCode,
                    total: total
                },
                function (res) {
                    res = JSON.parse(res);
                    if (res["0"].accepted === 1 && res.points_rewarded) {
                        $.ajax({
                            url: 'https://opt03.amocrm.ru/api/v4/leads/' + AMOCRM.constant('card_id') + '/notes',
                            method: 'post',
                            dataType: 'json',
                            data: JSON.stringify({
                                'note_type': {
                                    "note_type": 'common'
                                },
                                'params': {
                                    "note_type": 'common',
                                    "text": '✅Клиенту начислены UDS баллы в размере: ' + res.points_rewarded + ' баллов.'
                                }
                            }),
                            success: function (res) {
                                location.reload();
                            },
                            error: function (jqXHR, textStatus, errorThrown) {
                                console.log("Ошибка при обновлении сделки:", textStatus, errorThrown);
                            }
                        });
                    }
                }
            );

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

                        const params = {
                            hasDiscount: hasDiscount
                        };

                        const callback = function (template) {
                            const markup = template.render(params);
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