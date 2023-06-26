/* globals wc_pagarme_checkout */

$ = jQuery;

let cardsMethods = [];

let pagarmeCard = {
    limitTokenize: 10,
    canSubmit: false,
    tokenExpirationAttribute: 'data-pagarmecheckout-expiration',
    cardNumberTarget: 'input[data-element="pagarme-card-number"]',
    brandTarget: 'input[data-pagarmecheckout-element="brand-input"]',
    valueTarget: 'input[data-pagarmecheckout-element="order-value"]',
    installmentsTarget: '[data-pagarme-component="installments"]',
    mundiCdn: 'https://cdn.mundipagg.com/assets/images/logos/brands/png/',
    tokenElement: '[data-pagarmecheckout-element="token"]',
    fieldsetCardElements: 'fieldset[data-pagarmecheckout="card"]',
    billingCpfId: '#billing_cpf',
    voucherDocumentHolder: 'input[name="pagarme[voucher][cards][1][document-holder]"]',
    formatEventToJQuery: function (event) {
        if (event instanceof $.Event) {
            return $(event.currentTarget);
        }
        if (!(event instanceof $)) {
            return $(event);
        }
        return event;
    },
    haveCardForm: function (e) {
        let elem = null;
        if (e instanceof $) {
            elem = e;
        }
        if (e instanceof $.Event) {
            elem = $(e.currentTarget);
        }
        if (!elem) {
            throw new Error("Can't check card form: Invalid element received");
        }
        if (elem.is("fieldset") && elem.attr("data-pagarmecheckout") === 'card') {
            return true;
        }
        return !!elem.has(this.fieldsetCardElements).length;
    },
    getCheckoutPaymentElement: function () {
        let value = $('.woocommerce form input[name="payment_method"]:checked').val();
        return $('.wc_payment_method.payment_method_' + value);
    },
    isPagarmePayment: function () {
        return $('.woocommerce form input[name="payment_method"]:checked').val().indexOf('pagarme');
    },
    keyEventHandlerCard: function (e) {
        this.clearToken(e);
        this.loadBrand(e);
    },
    clearErrorMessages: function () {
        $('input[name$="payment_method"]:checked')
            .closest('li')
            .find('#wcmp-checkout-errors')
            .hide();
        wc_pagarme_checkout.errorTokenize = false;
    },
    clearToken: function (e) {
        const token = $(e.currentTarget).closest(this.fieldsetCardElements)
            .find(this.tokenElement);
        $(token).remove();
        this.canSubmit = false;
    },
    formHandler: function () {
        if (this.isPagarmePayment()) {
            let e = this.getCheckoutPaymentElement();
            const cardsForm = e.find(this.fieldsetCardElements);
            return this.checkTokenCard(cardsForm);
        }
        return true;
    },
    hasSelectedWallet: function (el) {
        let elWallet = $(el).find('select[data-element="choose-credit-card"]');
        if (elWallet.length) {
            return elWallet.val().trim() !== '';
        }
        return false;
    },

    checkTokenCard: function (e) {
        let allResult = [];
        e.each(async function () {
            if (pagarmeCard.hasSelectedWallet(this)) {
                allResult.push(true);
                return;
            }
            allResult.push(pagarmeCard.checkToken(this));
        });
        return !allResult.includes(false);
    },

    wait: async function (ms = 1000) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    },
    checkToken: function (e) {
        if (!(e instanceof jQuery)) {
            e = $(e);
        }
        return !!e.find(this.tokenElement).length && this.checkTokenExpirationDate(e.find(this.tokenElement));
    },

    checkTokenExpirationDate: function (e) {
        const expirationDateTimeAttribute = e.attr(this.tokenExpirationAttribute);
        const expirationDate = new Date(expirationDateTimeAttribute);
        return expirationDate > new Date();
    },

    getCardDataContingency: async function (cardNumber) {
        let oldPrefix = '',
            types = await this.getBrands(true),
            bin = cardNumber.substring(0, 6),
            data;
        for (const currentType of types) {
            for (const prefix of currentType.prefixes) {
                const prefixText = prefix.toString();
                if (bin.indexOf(prefixText) === 0 && oldPrefix.length < prefixText.length) {
                    oldPrefix = prefixText;
                    data = currentType;
                }
            }
        }
        return data;
    },

    getBrands: function (onlyBrands = false) {
        return new Promise((resolve) => {
            if (onlyBrands) {
                let types = [];
                cardsMethods.forEach(function (key) {
                    $.each(wc_pagarme_checkout.config.payment[key].brands, function () {
                        types.push(this);
                    });
                });
                resolve(types);
            }
        });
    },

    getCardsMethods: function () {
        $.each(wc_pagarme_checkout.config.payment, function (method) {
            if (wc_pagarme_checkout.config.payment[method].is_card) {
                cardsMethods.push(method);
            }
        });
    },

    loadBrand: async function (e) {
        let elem = e.currentTarget;
        if (!this.isVisible(elem)) {
            return;
        }
        let cardNumber = elem.value.replace(/\s/g, '');
        if (cardNumber.length < 6) {
            return;
        }
        try {
            let card = await this.getCardData(cardNumber);
            this.changeBrand(e, card);
            this.updateInstallmentsElement(e);
        } catch (exception) {
            this.showError(exception.message);
        }
    },
    isVisible: function (obj) {
        return obj.offsetWidth > 0 && obj.offsetHeight > 0;
    },

    getCardData: async function (cardNumber) {
        let result = [];
        let value = await this.getCardDataByApi(cardNumber);
        if (value === 'error' || typeof value.brandName == 'undefined') {
            value = await this.getCardDataContingency(cardNumber);
        }
        if (typeof value === 'undefined') {
            return undefined;
        }
        let codeWithArray = {
            name: 'CVV',
            size: value.cvv
        };
        value = {
            title: value.brandName,
            type: value.brandName,
            gaps: value.gaps,
            lengths: value.lenghts,
            image: value.brandImage,
            mask: value.mask,
            size: value.size,
            brand: value.brand,
            possibleBrands: value.possibleBrands,
            code: codeWithArray
        };
        result.push($.extend(true, {}, value));
        return result;
    },

    getCardDataByApi: function (cardNumber) {
        return new Promise((resolve) => {
            let bin = cardNumber.substring(0, 6);
            $.ajax({
                type: "GET",
                dataType: "json",
                url: 'https://api.mundipagg.com/bin/v1/' + bin,
                async: false,
                cache: false,
                success: function (data) {
                    resolve(data);
                },
                error: function (xhr, textStatus) {
                    resolve(textStatus);
                }
            });
        });
    },

    changeBrand: function (e, card) {
        if (typeof e == 'undefined' || typeof card == 'undefined') {
            throw new Error("Invalid data to change card brand");
        }
        let elem = e.currentTarget;
        let imageSrc = this.getImageSrc(card);
        let imgElem = $(elem).parent().find('img');
        $(elem).parents('.pagarme-card-number-row').find(this.brandTarget).attr('value', card[0].brand);
        if (imgElem.length) {
            imgElem.attr('src', imageSrc);
        } else {
            let img = $(document.createElement('img'));
            $(elem).parent().append(
                img.attr(
                    'src', imageSrc
                )
            );
        }
    },

    getImageSrc: function (card) {
        if (card[0].image) {
            return card[0].image;
        }
        return this.mundiCdn + card[0].brand + '.png';
    },

    formatValue: function (value, raw = true) {
        if (raw) {
            if (typeof value !== 'string') {
                value = value.toString();
            }
            return parseFloat(value.replace(',', '.'));
        }
        if (typeof value === 'string') {
            value = parseFloat(value);
        }
        return value.toFixed(2).replace('.', ',');
    },

    updateInstallmentsElement: function (e) {
        let elem = null;
        if (e instanceof $) {
            elem = e;
        }
        if (e instanceof $.Event) {
            elem = $(e.currentTarget);
        }
        if (!elem) {
            return false;
        }
        let brand = elem.closest('fieldset').find(this.brandTarget).val();
        let total = elem.closest('fieldset').find(this.valueTarget).val();
        if (total) {
            total = pagarmeCard.formatValue(total);
        }
        let cardForm = elem.closest("fieldset");
        let select = cardForm.find(this.installmentsTarget);
        if (!total)
            total = cartTotal;
        if ((!total) ||
            (select.data("type") === 2 && !brand) ||
            (select.data("type") === 1 && elem.data('element') !== "order-value"))
            return false;
        let storageName = btoa(brand + total);
        sessionStorage.removeItem(storageName);
        let storage = sessionStorage.getItem(storageName);
        if (storage) {
            select.html(storage);
        } else {
            let ajax = $.ajax({
                'url': ajaxUrl,
                'data': {
                    'action': 'xqRhBHJ5sW',
                    'flag': brand,
                    'total': total
                }
            });
            ajax.done(function (response) {
                pagarmeCard._done(select, storageName, cardForm, response);
            });
            ajax.fail(function () {
                pagarmeCard._fail(cardForm);
            });
            pagarmeCard.showLoader(cardForm);
        }
        return true;
    },

    _done: function (select, storageName, e, response) {
        select.html(response);
        sessionStorage.setItem(storageName, response);
        this.removeLoader(e);
    },

    _fail: function (e) {
        this.removeLoader(e);
    },

    removeLoader: function (e) {
        if (!(e instanceof jQuery)) {
            e = $(e);
        }
        e.unblock();
    },

    showLoader: function (e) {
        if (!(e instanceof jQuery)) {
            e = $(e);
        }
        e.block({
            message: null,
            overlayCSS: {
                background: '#fff',
                opacity: 0.6
            }
        });
    },

    showError: function (text) {
        const errorMessageText = this.translateErrors('card', text);
        const message = {
            type: 'error',
            html: errorMessageText,
            allowOutsideClick: false
        };
        swal(message);
    },
    translateErrors: function (error, message) {
        error = error.replace('request.', '');
        const output = `${error}: ${message}`;
        const ptBrMessages = PagarmeGlobalVars.checkoutErrors.pt_BR;

        if (PagarmeGlobalVars.WPLANG !== 'pt_BR') {
            return output;
        }

        if (ptBrMessages.hasOwnProperty(output)) {
            return ptBrMessages[output];
        }

        return output;
    },
    execute: async function (e) {
        let result = pagarmeCard.formHandler(),
            i = 1;
        try {
            while (!result && i <= this.limitTokenize) {
                if (i === this.limit) {
                    this.removeLoader(this.getCheckoutPaymentElement());
                    throw new Error("Tokenize timeout");
                }
                if (wc_pagarme_checkout.errorTokenize === true) {
                    this.removeLoader(this.getCheckoutPaymentElement());
                    return;
                }
                await pagarmeCard.wait();
                result = pagarmeCard.formHandler();
                i++;
            }

            this.canSubmit = true;
            $('form#order_review').submit();
        } catch (er) {
            if (typeof er === 'string') {
                this.showError(er);
            } else {
                this.showError(er.message);
            }
        }
    },
    canExecute: function (e) {
        // e.preventDefault();
        if (!wc_pagarme_checkout.validate() || wc_pagarme_checkout.errorTokenize === true) {
            return false;
        }
        let el = pagarmeCard.getCheckoutPaymentElement();
        if (pagarmeCard.isPagarmePayment() && !pagarmeCard.canSubmit &&
            pagarmeCard.haveCardForm(el)
        ) {
            pagarmeTokenize.execute();
            pagarmeCard.execute(e);
            return false;
        }
        return true;
    },
    onChangeBillingCpf: function () {
        // if ($(this.voucherDocumentHolder).length === 0) {
        //     return;
        // }
        let cpf = $(this.billingCpfId).val();
        $(this.voucherDocumentHolder).empty();
        $(this.voucherDocumentHolder).val(cpf);
    },
    addEventListener: function () {
        $(document.body).on('updated_checkout', function () {
            pagarmeCard.renewEventListener();
        });
        $('form.checkout').on('checkout_place_order', function (e) {
            return pagarmeCard.canExecute(e);
        });
        $('form#order_review').on('submit', function (event) {
            return pagarmeCard.canExecute(event);
        });
        $(this.billingCpfId).on('change', function () {
            pagarmeCard.onChangeBillingCpf();
        });
    },
    renewEventListener: function () {
        $(this.cardNumberTarget).on('change', function (event) {
            pagarmeCard.keyEventHandlerCard(event);
        });
        $(`${this.fieldsetCardElements} input`).on('change', function () {
            pagarmeCard.clearErrorMessages();
        });
        if (typeof pagarmeCheckoutWallet == 'object') {
            pagarmeCheckoutWallet.start();
        }
        if (typeof pagarmeOrderValue == 'object') {
            pagarmeOrderValue.start();
        }
    },
    start: function () {
        console.log("oi");
        this.getCardsMethods();
        this.getBrands();
        this.addEventListener();
        this.renewEventListener();
        this.onChangeBillingCpf();
    },
};
pagarmeCard.start();
