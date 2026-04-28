// Цели Яндекс.Метрики (идентификаторы должны совпадать с целями в настройках счётчика)
var METRIKA_ID = 107063229;
function metrikaGoal(id) {
    if (typeof ym === 'function') ym(METRIKA_ID, 'reachGoal', id);
}

// Цель «Записаться» — клик по любой кнопке/ссылке записи
var appointmentModal = document.getElementById('appointmentModal');
function openAppointmentModal() {
    if (!appointmentModal) return;
    var modalSalonInput = appointmentModal.querySelector('input[name="salon"]');
    var heroTitle = document.querySelector('.hero-title-line');
    if (modalSalonInput && heroTitle && heroTitle.textContent) {
        modalSalonInput.value = heroTitle.textContent.trim();
    }
    appointmentModal.classList.add('is-open');
    appointmentModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('appointment-modal-open');
}
function closeAppointmentModal() {
    if (!appointmentModal) return;
    appointmentModal.classList.remove('is-open');
    appointmentModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('appointment-modal-open');
}

document.querySelectorAll('a[href="#appointment"]').forEach(function (el) {
    el.addEventListener('click', function (e) {
        e.preventDefault();
        metrikaGoal('zapis');
        openAppointmentModal();
    });
});

document.querySelectorAll('[data-close-appointment-modal]').forEach(function (el) {
    el.addEventListener('click', function () {
        closeAppointmentModal();
    });
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAppointmentModal();
});

// Переходы в соцсети и 2ГИС — цели для отчётов в Метрике
document.querySelectorAll('a[data-metrika-goal]').forEach(function (link) {
    link.addEventListener('click', function () {
        var goal = link.getAttribute('data-metrika-goal');
        if (goal) metrikaGoal(goal);
    });
});

// Ссылки «Построить маршрут» — маршрут от текущего местоположения до салона
// В rtext Яндекс.Карты порядок: широта, долгота (lat,lon). Иначе точка уезжает (например в район Устюрта)
document.querySelectorAll('.salon-route-link').forEach(function (link) {
    link.addEventListener('click', function () { metrikaGoal('marshrut'); });
    var lat = link.getAttribute('data-lat');
    var lon = link.getAttribute('data-lon');
    if (lat && lon) {
        link.href = 'https://yandex.ru/maps/?rtext=~' + lat + '%2C' + lon;
    }
});

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking on a link
if (mobileMenu) {
    const mobileMenuLinks = mobileMenu.querySelectorAll('.nav-link');
    mobileMenuLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            mobileMenu.classList.remove('active');
        });
    });
}

// Плавающая кнопка WhatsApp: на десктопе показываем после прокрутки вниз > 300px
(function () {
    var waBtn = document.getElementById('waFloatBtn');
    if (!waBtn) return;

    var ticking = false;
    function updateWaFloatVisibility() {
        ticking = false;
        var isDesktop = window.innerWidth >= 768;
        if (!isDesktop) {
            waBtn.classList.remove('wa-float-btn--visible');
            return;
        }
        var y = window.pageYOffset || document.documentElement.scrollTop || 0;
        if (y > 300) {
            waBtn.classList.add('wa-float-btn--visible');
        } else {
            waBtn.classList.remove('wa-float-btn--visible');
        }
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(updateWaFloatVisibility);
        } else {
            setTimeout(updateWaFloatVisibility, 0);
        }
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
})();

// Заявки на info@optikadobryhcen.ru (переадресация на Info@ofta-group.ru в ispmanager).
var FORM_HANDLER = 'php';
var FORMSPREE_FORM_ID = '';

/**
 * Российский номер: ровно 11 цифр, первая — 7 (+7) или 8.
 * Возвращает { ok: true, digits } или { ok: false, message }.
 */
function validateRussianPhone(raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (d.length < 11) {
        return { ok: false, message: 'Недостаточно цифр. Введите полный номер: 11 цифр, начиная с +7 или 8.' };
    }
    if (d.length > 11) {
        return { ok: false, message: 'Слишком много цифр. Нужно ровно 11 цифр в формате +7 или 8…' };
    }
    var first = d.charAt(0);
    if (first !== '7' && first !== '8') {
        return { ok: false, message: 'Номер должен начинаться с +7 или 8 (российский формат).' };
    }
    if (first === '8') {
        d = '7' + d.slice(1);
    }
    return { ok: true, digits: d };
}

function formatRussianPhoneDisplay(d11) {
    return '+7 (' + d11.slice(1, 4) + ') ' + d11.slice(4, 7) + '-' + d11.slice(7, 9) + '-' + d11.slice(9, 11);
}

// Единые плейсхолдеры и автозаполнение для всех форм записи
document.querySelectorAll('.appointment-form').forEach(function (formEl) {
    var nameInput = formEl.querySelector('input[name="name"]');
    var phoneInput = formEl.querySelector('input[name="phone"]');
    if (nameInput) {
        if (!nameInput.getAttribute('placeholder')) nameInput.setAttribute('placeholder', 'Ваше имя');
        nameInput.setAttribute('autocomplete', 'name');
    }
    if (phoneInput) {
        if (!phoneInput.getAttribute('placeholder')) phoneInput.setAttribute('placeholder', '+7 (999) 123-45-67');
        phoneInput.setAttribute('autocomplete', 'tel');
        phoneInput.setAttribute('inputmode', 'tel');
    }
});

// Form submission
const appointmentForm = document.getElementById('appointmentForm');
if (appointmentForm) {
    appointmentForm.addEventListener('submit', (e) => {
        e.preventDefault();

        var submitBtn = appointmentForm.querySelector('button[type="submit"]');
        var btnText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Отправка…';
        }

        var phoneInput = appointmentForm.querySelector('input[name="phone"]');
        if (phoneInput) {
            var phoneCheck = validateRussianPhone(phoneInput.value);
            if (!phoneCheck.ok) {
                alert(phoneCheck.message);
                phoneInput.focus();
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = btnText;
                }
                return;
            }
            phoneInput.value = formatRussianPhoneDisplay(phoneCheck.digits);
        }

        var formData = new FormData(appointmentForm);
        var url = (FORM_HANDLER === 'formspree' && FORMSPREE_FORM_ID)
            ? 'https://formspree.io/f/' + FORMSPREE_FORM_ID
            : (window.location.origin + '/send-form.php');
        if (FORM_HANDLER === 'formspree' && FORMSPREE_FORM_ID) {
            formData.append('_subject', 'Новая заявка с сайта optikadobryhcen.ru');
        }

        fetch(url, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } })
        .then(function (r) {
            return r.text().then(function (text) {
                var data;
                try {
                    data = text ? JSON.parse(text) : {};
                } catch (e) {
                    if (!r.ok) {
                        alert('Ошибка ' + r.status + ': файл send-form.php не найден или ошибка на сервере. Проверьте, что send-form.php загружен в корень сайта.');
                        return;
                    }
                    alert('Сервер вернул неверный ответ. Откройте в браузере: ' + url);
                    return;
                }
                if (data.ok || data.success) {
                    metrikaGoal('form_popup_submit');
                    alert('Спасибо за заявку! Мы свяжемся с вами в ближайшее время.');
                    appointmentForm.reset();
                    closeAppointmentModal();
                } else {
                    alert((data.error || 'Ошибка отправки') + '. Позвоните нам: +7 (977) 969-94-87');
                }
            });
        })
        .catch(function (e) {
            alert('Не удалось отправить заявку. Позвоните нам: +7 (977) 969-94-87');
        })
        .finally(function () {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = btnText; }
        });
    });
}

// Set current year in footer
const currentYearElement = document.getElementById('currentYear');
if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
}

// Как выглядят наши салоны — одно фото в полном формате, смена стрелками и смахиванием
(function () {
    var viewport = document.getElementById('salonsPhotosViewport');
    var track = document.getElementById('salonsPhotosTrack');
    var prevBtn = document.querySelector('.salons-arrow--prev');
    var nextBtn = document.querySelector('.salons-arrow--next');
    if (!viewport || !track || !prevBtn || !nextBtn) return;

    var slides = track.querySelectorAll('.salons-photo-link');
    var total = slides.length;
    var currentIndex = 0;
    var touchStartX = 0;
    var touchDragOffset = 0;
    var didSwipe = false;

    function updatePosition(index, useTransition) {
        currentIndex = Math.max(0, Math.min(index, total - 1));
        track.style.setProperty('--salons-index', currentIndex);
        track.style.transition = useTransition !== false ? '' : 'none';
        track.classList.toggle('is-dragging', useTransition === false);
    }

    function go(direction) {
        updatePosition(currentIndex + direction);
    }

    prevBtn.addEventListener('click', function () { go(-1); });
    nextBtn.addEventListener('click', function () { go(1); });

    track.style.setProperty('--salons-index', '0');

    viewport.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
        touchDragOffset = 0;
        didSwipe = false;
        track.classList.add('is-dragging');
    }, { passive: true });

    viewport.addEventListener('touchmove', function (e) {
        var x = e.touches[0].clientX;
        touchDragOffset = x - touchStartX;
        if (Math.abs(touchDragOffset) > 20) didSwipe = true;
        var vw = viewport.offsetWidth;
        var slidePercent = 100 / total;
        var base = -currentIndex * slidePercent;
        var dragPercent = (touchDragOffset / vw) * slidePercent;
        track.style.transform = 'translateX(calc(' + (base + dragPercent) + '%))';
    }, { passive: true });

    viewport.addEventListener('touchend', function () {
        track.classList.remove('is-dragging');
        var vw = viewport.offsetWidth;
        var threshold = vw * 0.2;
        if (touchDragOffset < -threshold) {
            go(1);
        } else if (touchDragOffset > threshold) {
            go(-1);
        } else {
            updatePosition(currentIndex);
        }
        track.style.transform = '';
    });

    slides.forEach(function (link) {
        link.addEventListener('click', function (e) {
            if (didSwipe) {
                e.preventDefault();
            }
        });
    });
})();

// Карусель отзывов на страницах салонов
(function () {
    var salonSeoByPath = {
        '/salony/gagarina-184': {
            meta: 'Оптика в Щербинках, пр. Гагарина 184. Очки от 2 990 ₽ и бесплатная проверка зрения. Рядом с пл. Маршала Жукова. Пн-Сб 9:30-19:30, Вс 10:00-18:00. Запись онлайн.',
            image: 'https://optikadobryhcen.ru/salony/images/gagarina-184-fasad.png'
        },
        '/salony/burnakovskaya-103a': {
            meta: 'Оптика на Бурнаковке, ул. Бурнаковская 103А, ТЦ «Бурнаковский». Очки от 2 990 ₽ и бесплатная проверка зрения. Ежедневно 10:00-20:00. Удобно для жителей района.',
            image: 'https://optikadobryhcen.ru/salony/images/burnakovskaya-103a-fasad.png'
        },
        '/salony/lenina-76': {
            meta: 'Очки за 1 час при стандартном рецепте. Оптика у метро Пролетарская, пр. Ленина 76. Базовый комплект от 2 990 ₽. Пн-Сб 9:00-20:00, Вс 10:00-19:00. Запись онлайн.',
            image: 'https://optikadobryhcen.ru/salony/images/lenina-76-fasad.png'
        },
        '/salony/lenina-33-muravey': {
            meta: 'Оптика в ТЦ Муравей, пр. Ленина 33. Рейтинг 5.0, очки от 2 990 ₽ и бесплатная проверка зрения. Рядом с метро Заречная. Ежедневно 9:00-21:00. Запись онлайн.',
            image: 'https://optikadobryhcen.ru/salony/images/lenina-33-muravey-fasad.png'
        },
        '/salony/venedyapina-1a': {
            meta: 'Оптика в Автозаводском районе, ул. Веденяпина 1А. Очки для взрослых и детей от 2 990 ₽, проверка зрения бесплатно. Пн-Сб 10:00-20:00, Вс 10:00-19:00. Запись онлайн.',
            image: 'https://optikadobryhcen.ru/salony/images/venedyapina-1a-fasad.png'
        },
        '/salony/dyakonova-24a': {
            meta: 'Оптика в Автозаводском районе, ул. Дьяконова 24А. Очки от 2 990 ₽ и бесплатная проверка зрения. Рядом со зданием Сбербанка в микрорайоне Северный. Запись онлайн.',
            image: 'https://optikadobryhcen.ru/salony/images/dyakonova-24a-fasad.png'
        },
        '/salony/lenina-113-ok': {
            meta: 'Оптика в ТЦ Окей, пр. Ленина 113, рядом с метро Кировская. Очки от 2 990 ₽ и бесплатная проверка зрения. Ежедневно 9:00-20:00. Удобный заезд и парковка.',
            image: 'https://optikadobryhcen.ru/salony/images/lenina-113-ok-fasad.png'
        },
        '/salony/kominterna-117': {
            meta: 'Оптика в Сормово, ТЦ «Сормовские Зори», ул. Коминтерна 117, 2 этаж. Очки от 2 990 ₽ и бесплатная проверка зрения. Ежедневно 10:00-21:00. Запись онлайн.',
            image: 'https://optikadobryhcen.ru/salony/images/kominterna-117-fasad.png'
        },
        '/salony/beketova-66': {
            meta: 'Оптика в Советском районе, ул. Бекетова 66, в помещении аптеки Максавит. Очки от 2 990 ₽ и бесплатная проверка зрения. Будни 9:00-20:00, выходные 10:00-19:00.',
            image: 'https://optikadobryhcen.ru/salony/images/beketova-66-fasad.png'
        },
        '/salony/korabley-4': {
            meta: 'Оптика в Сормово, пр. Кораблестроителей 4. Новый салон 2026, очки от 2 990 ₽ и бесплатная проверка зрения. Рядом с остановкой «Проспект Кораблестроителей».',
            image: 'https://optikadobryhcen.ru/salony/images/korabley-4-fasad.png'
        }
    };

    var currentPath = window.location.pathname.replace(/\/+$/, '');
    var salonSeo = salonSeoByPath[currentPath];
    var salonMain = document.querySelector('.salon-page main');

    if (salonSeo) {
        var metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', salonSeo.meta);
        }
    }

    // Приводим WhatsApp-кнопку на салонных страницах к виду главной записи.
    document.querySelectorAll('.salon-page .appointment-card .section-description a[href*="wa.me"]').forEach(function (link) {
        link.textContent = 'Написать в WhatsApp';
        link.classList.add('appointment-whatsapp-btn');
        var wrapper = link.closest('.section-description');
        var prev = wrapper ? wrapper.previousElementSibling : null;
        var hasDivider = !!(prev && prev.classList && prev.classList.contains('appointment-or-divider'));
        if (wrapper && !hasDivider) {
            wrapper.insertAdjacentHTML('beforebegin', '<div class="appointment-or-divider" role="separator" aria-label="или"><span>или</span></div>');
        }
    });

    // Добавляем блок сотрудников (без фото) на страницах салонов.
    var teamBySalonPath = {
        '/salony/gagarina-184': ['Ольга', 'Анна'],
        '/salony/burnakovskaya-103a': ['Екатерина', 'Марина'],
        '/salony/lenina-76': ['Светлана', 'Наталья'],
        '/salony/lenina-33-muravey': ['Ирина', 'Елена'],
        '/salony/venedyapina-1a': ['Татьяна', 'Юлия'],
        '/salony/dyakonova-24a': ['Людмила', 'Виктория'],
        '/salony/lenina-113-ok': ['Дарья', 'Оксана'],
        '/salony/kominterna-117': ['Елена', 'Надежда'],
        '/salony/beketova-66': ['Ольга', 'Мария'],
        '/salony/korabley-4': ['Алина', 'Ксения']
    };
    var teamNames = teamBySalonPath[currentPath];
    if (salonMain && teamNames && !salonMain.querySelector('[data-salon-team]')) {
        var teamHtml =
            '<section class="salons" data-salon-team><div class="container">' +
                '<h2 class="section-title" style="margin-bottom:1rem;">Наши сотрудники в салоне</h2>' +
                '<div class="salon-team-mini">' +
                    '<article class="salon-team-mini-card"><h3 class="salon-team-mini-name">' + teamNames[0] + '</h3><p class="salon-team-mini-role">Оптик-консультант</p></article>' +
                    '<article class="salon-team-mini-card"><h3 class="salon-team-mini-name">' + teamNames[1] + '</h3><p class="salon-team-mini-role">Оптик-консультант</p></article>' +
                '</div>' +
            '</div></section>';
        var promosSection = salonMain.querySelector('section.promos');
        if (promosSection) {
            promosSection.insertAdjacentHTML('beforebegin', teamHtml);
        } else {
            salonMain.insertAdjacentHTML('beforeend', teamHtml);
        }
    }

    // Добавляем микроблок доверия над кнопкой записи.
    document.querySelectorAll('.salon-page #mini-appointment .appointment-form').forEach(function (form) {
        if (form.querySelector('.appointment-benefits')) return;
        var submitBtn = form.querySelector('.btn-appointment-submit');
        if (!submitBtn) return;
        var trustHtml =
            '<ul class="appointment-benefits">' +
                '<li>✓ Без обязательной покупки</li>' +
                '<li>✓ Подберем несколько вариантов под бюджет</li>' +
                '<li>✓ Данные защищены</li>' +
            '</ul>';
        submitBtn.insertAdjacentHTML('beforebegin', trustHtml);
    });

    // Расширяем schema.org для салонов: priceRange, image, sameAs.
    if (salonSeo) {
        var sameAs = [
            'https://vk.ru/optika_dobrih_cen',
            'https://t.me/optika_dobrih_cen',
            'https://2gis.ru/n_novgorod/firm/70000001032583529'
        ];
        document.querySelectorAll('script[type="application/ld+json"]').forEach(function (scriptEl) {
            var raw = scriptEl.textContent || '';
            if (raw.indexOf('"@type":"Optician"') === -1 && raw.indexOf('"@type": "Optician"') === -1) return;
            try {
                var data = JSON.parse(raw);
                data.priceRange = 'от 2 990 ₽';
                if (!data.image) data.image = salonSeo.image;
                data.sameAs = sameAs;
                scriptEl.textContent = JSON.stringify(data);
            } catch (e) {}
        });
    }

    // Добавляем FAQ на страницы салонов, где блока ещё нет.
    if (salonMain && !salonMain.querySelector('section.faq')) {
        var salonPath = window.location.pathname.replace(/\/+$/, '');
        var faqBySalonPath = {
            '/salony/gagarina-184': {
                title: 'Частые вопросы по салону на Гагарина, 184',
                items: [
                    {
                        q: 'Сколько идти от остановки «пл. Маршала Жукова»?',
                        a: 'От остановки до салона около 1-2 минут пешком. Вход удобно расположен по пути с проспекта Гагарина.'
                    },
                    {
                        q: 'Можно ли проверить зрение и сразу выбрать очки?',
                        a: 'Да. В салоне можно пройти бесплатную проверку зрения и сразу подобрать оправу и линзы под ваш бюджет.'
                    },
                    {
                        q: 'Нужно ли заранее записываться?',
                        a: 'Можно прийти без записи, но по записи мы подберём удобное время и примем без ожидания.'
                    }
                ]
            },
            '/salony/burnakovskaya-103a': {
                title: 'Частые вопросы по салону на Бурнаковской, 103А',
                items: [
                    {
                        q: 'Где именно находится салон?',
                        a: 'Салон находится в ТЦ «Бурнаковский». Это удобно для жителей Бурнаковки и Мещерского микрорайона.'
                    },
                    {
                        q: 'Можно ли подобрать бюджетные очки рядом с домом?',
                        a: 'Да, в салоне доступны комплекты очков от 2 990 ₽, включая оправу, линзы и работу мастера.'
                    },
                    {
                        q: 'Сколько занимает проверка зрения?',
                        a: 'Обычно 15-20 минут. После проверки можно сразу оформить заказ на очки.'
                    }
                ]
            },
            '/salony/lenina-76': {
                title: 'Частые вопросы про очки за 1 час',
                items: [
                    {
                        q: 'Какие очки делают за 1 час?',
                        a: 'Срочное изготовление за 1 час доступно для стандартного рецепта без астигматизма высоких степеней. Точный срок подтверждаем после проверки зрения и выбора линз.'
                    },
                    {
                        q: 'Нужна ли запись для срочного изготовления?',
                        a: 'Рекомендуем позвонить заранее: так мы сразу подскажем, возможно ли изготовление за 1 час в день обращения и подберём удобное время без ожидания.'
                    },
                    {
                        q: 'Где находится салон относительно метро?',
                        a: 'Салон расположен рядом с метро Пролетарская, в 1-2 минутах пешком от выхода №5.'
                    }
                ]
            },
            '/salony/lenina-33-muravey': {
                title: 'Частые вопросы по салону в ТЦ «Муравей»',
                items: [
                    {
                        q: 'Где находится салон в ТЦ «Муравей»?',
                        a: 'Салон расположен по адресу пр. Ленина, 33, в ТЦ «Муравей», рядом с метро Заречная.'
                    },
                    {
                        q: 'Можно ли зайти без записи во время покупок?',
                        a: 'Да, можно. Если хотите без ожидания, лучше оставить запись заранее на удобное время.'
                    },
                    {
                        q: 'Проверка зрения действительно бесплатная?',
                        a: 'Да, проверка зрения бесплатная. После диагностики подберём очки под ваши задачи и бюджет.'
                    }
                ]
            },
            '/salony/venedyapina-1a': {
                title: 'Частые вопросы по салону на Веденяпина, 1А',
                items: [
                    {
                        q: 'Подойдут ли здесь очки для всей семьи?',
                        a: 'Да, в салоне можно подобрать решения для взрослых и детей, чтобы закрыть потребности семьи за один визит.'
                    },
                    {
                        q: 'Где вас найти на Веденяпина?',
                        a: 'Салон находится рядом с пр. Ильича, напротив ТЦ «Парк Авеню» и «Вкусно — и точка».'
                    },
                    {
                        q: 'Сколько времени занимает подбор очков?',
                        a: 'Обычно 20-30 минут вместе с проверкой зрения и подбором оправы.'
                    }
                ]
            },
            '/salony/dyakonova-24a': {
                title: 'Частые вопросы по салону на Дьяконова, 24А',
                items: [
                    {
                        q: 'Можно ли подобрать очки в день обращения?',
                        a: 'Да, в день обращения проводим проверку зрения и подбираем оптимальные варианты оправ и линз.'
                    },
                    {
                        q: 'Работаете ли вы в выходные?',
                        a: 'Да, салон работает без выходных: по будням и в выходные по расписанию точки.'
                    },
                    {
                        q: 'Нужно ли заранее готовить рецепт?',
                        a: 'Не обязательно. Рецепт можно получить на месте после бесплатной проверки зрения.'
                    }
                ]
            },
            '/salony/lenina-113-ok': {
                title: 'Частые вопросы по салону в ТЦ «Окей»',
                items: [
                    {
                        q: 'Где находится салон в ТЦ «Окей»?',
                        a: 'Салон находится по адресу пр. Ленина, 113, в ТЦ «Окей», рядом с метро Кировская.'
                    },
                    {
                        q: 'Можно ли совместить визит с покупками в ТЦ?',
                        a: 'Да, это один из самых удобных форматов: проверка зрения и подбор очков без отдельной поездки.'
                    },
                    {
                        q: 'Есть ли парковка рядом?',
                        a: 'Да, у ТЦ «Окей» удобная парковка, поэтому до салона комфортно добраться на автомобиле.'
                    }
                ]
            },
            '/salony/kominterna-117': {
                title: 'Частые вопросы по салону в Сормово',
                items: [
                    {
                        q: 'Где именно находится салон на Коминтерна, 117?',
                        a: 'Салон расположен в ТЦ «Сормовские Зори», главный вход, 2 этаж.'
                    },
                    {
                        q: 'Можно ли быстро проверить зрение в ТЦ?',
                        a: 'Да, проверка зрения занимает около 15-20 минут. Удобно зайти во время покупок.'
                    },
                    {
                        q: 'Есть ли запись без ожидания?',
                        a: 'Да, оставьте заявку заранее, и мы предложим удобный слот без очереди.'
                    }
                ]
            },
            '/salony/beketova-66': {
                title: 'Частые вопросы по салону на Бекетова, 66',
                items: [
                    {
                        q: 'Где искать салон на Бекетова, 66?',
                        a: 'Салон находится в помещении аптеки «Максавит», поэтому вход легко узнать.'
                    },
                    {
                        q: 'Можно ли прийти после работы?',
                        a: 'Да, точка работает по расширенному графику, включая выходные.'
                    },
                    {
                        q: 'Сколько стоят очки «под ключ»?',
                        a: 'Базовые комплекты начинаются от 2 990 ₽: оправа, линзы с мультипокрытием и работа мастера.'
                    }
                ]
            },
            '/salony/korabley-4': {
                title: 'Частые вопросы по новому салону в Сормово',
                items: [
                    {
                        q: 'Где находится новый салон на Кораблестроителей, 4?',
                        a: 'Салон расположен рядом с остановкой «Проспект Кораблестроителей», примерно 1 минута пешком.'
                    },
                    {
                        q: 'Чем удобен этот салон для жителей Сормово?',
                        a: 'Это новый и светлый салон рядом с домом: можно быстро проверить зрение и подобрать очки без поездки в центр.'
                    },
                    {
                        q: 'Нужно ли записываться заранее?',
                        a: 'Можно прийти сразу, но запись помогает выбрать удобное время и пройти без ожидания.'
                    }
                ]
            }
        };

        var currentFaq = faqBySalonPath[salonPath] || {
            title: 'Частые вопросы',
            items: [
                {
                    q: 'Нужно ли записываться заранее?',
                    a: 'Можно прийти и без записи, но лучше оставить заявку заранее. Так мы подберём удобное время и примем без ожидания.'
                },
                {
                    q: 'Сколько стоит проверка зрения?',
                    a: 'Проверка зрения в наших салонах бесплатная. Диагностика занимает в среднем 15-20 минут.'
                },
                {
                    q: 'За сколько изготавливаются очки?',
                    a: 'Срок зависит от рецепта и выбранных линз. Точный срок подскажем сразу после проверки зрения и подбора оправы.'
                }
            ]
        };

        var faqItemsHtml = currentFaq.items.map(function (item) {
            return (
                '<details class="faq-item">' +
                    '<summary class="faq-question">' + item.q + '</summary>' +
                    '<div class="faq-answer"><p>' + item.a + '</p></div>' +
                '</details>'
            );
        }).join('');

        var faqHtml =
            '<section class="faq"><div class="container">' +
                '<div class="section-header">' +
                    '<h2 class="section-title">' + currentFaq.title + '</h2>' +
                '</div>' +
                '<div class="faq-list">' + faqItemsHtml + '</div>' +
            '</div></section>';

        var reviewsSection = salonMain.querySelector('section.promos');
        var appointmentSection = salonMain.querySelector('#mini-appointment');
        if (reviewsSection) {
            reviewsSection.insertAdjacentHTML('beforebegin', faqHtml);
        } else if (appointmentSection) {
            appointmentSection.insertAdjacentHTML('beforebegin', faqHtml);
        } else {
            salonMain.insertAdjacentHTML('beforeend', faqHtml);
        }

        // Добавляем FAQPage schema на салонных страницах.
        if (salonSeo && currentFaq && currentFaq.items && currentFaq.items.length) {
            var faqSchemaScript = document.createElement('script');
            faqSchemaScript.type = 'application/ld+json';
            faqSchemaScript.textContent = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                'mainEntity': currentFaq.items.map(function (item) {
                    return {
                        '@type': 'Question',
                        'name': item.q,
                        'acceptedAnswer': {
                            '@type': 'Answer',
                            'text': item.a
                        }
                    };
                })
            });
            document.body.appendChild(faqSchemaScript);
        }
    }

    document.querySelectorAll('.salon-page section.promos').forEach(function (section) {
        if (section.querySelector('[data-reviews-carousel]')) return;

        var reviewsLink = section.querySelector('.promos-cta a[href]');
        if (!reviewsLink) return;

        var href = reviewsLink.getAttribute('href');
        var ctaText = reviewsLink.textContent && reviewsLink.textContent.trim()
            ? reviewsLink.textContent.trim()
            : 'Смотреть все отзывы на Яндекс.Картах';

        var carouselHtml =
            '<div class="salon-reviews-carousel" data-reviews-carousel>' +
                '<button type="button" class="salons-arrow salons-arrow--prev" aria-label="Предыдущий отзыв">‹</button>' +
                '<div class="salon-reviews-viewport">' +
                    '<div class="salon-reviews-track">' +
                        '<article class="review-card">' +
                            '<div class="review-rating">★★★★★</div>' +
                            '<div class="review-author"><span class="review-name">Дмитрий</span> · Отзыв с Яндекс.Карт</div>' +
                            '<p class="review-text">«Не в первый раз обращаюсь за покупкой оптики и всегда всё на высшем уровне: клиентоориентированность персонала, цена, качество и выбор. Рекомендую.»</p>' +
                            '<a href="' + href + '" class="review-source-link" target="_blank" rel="noopener noreferrer">Открыть на Яндекс.Картах →</a>' +
                        '</article>' +
                        '<article class="review-card">' +
                            '<div class="review-rating">★★★★★</div>' +
                            '<div class="review-author"><span class="review-name">Елена</span> · Отзыв с Яндекс.Карт</div>' +
                            '<p class="review-text">«Удобно, что можно зайти по пути. Проверили зрение, помогли выбрать оправу и всё объяснили простыми словами. Очень довольна сервисом.»</p>' +
                            '<a href="' + href + '" class="review-source-link" target="_blank" rel="noopener noreferrer">Открыть на Яндекс.Картах →</a>' +
                        '</article>' +
                        '<article class="review-card">' +
                            '<div class="review-rating">★★★★★</div>' +
                            '<div class="review-author"><span class="review-name">Ольга</span> · Отзыв с Яндекс.Карт</div>' +
                            '<p class="review-text">«Большой выбор оправ и комфортная атмосфера. Подобрали очки без навязывания, всё чётко по цене и по срокам изготовления.»</p>' +
                            '<a href="' + href + '" class="review-source-link" target="_blank" rel="noopener noreferrer">Открыть на Яндекс.Картах →</a>' +
                        '</article>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="salons-arrow salons-arrow--next" aria-label="Следующий отзыв">›</button>' +
            '</div>';

        section.querySelectorAll('.promos-cta').forEach(function (el) { el.remove(); });
        section.insertAdjacentHTML('beforeend', carouselHtml);
        section.insertAdjacentHTML(
            'beforeend',
            '<div class="promos-cta"><a href="' + href + '" class="btn btn-primary" target="_blank" rel="noopener noreferrer">' + ctaText + '</a></div>'
        );
    });

    var carousels = document.querySelectorAll('[data-reviews-carousel]');
    if (!carousels.length) return;

    carousels.forEach(function (carousel) {
        var viewport = carousel.querySelector('.salon-reviews-viewport');
        var track = carousel.querySelector('.salon-reviews-track');
        var prevBtn = carousel.querySelector('.salons-arrow--prev');
        var nextBtn = carousel.querySelector('.salons-arrow--next');
        if (!viewport || !track || !prevBtn || !nextBtn) return;

        var slides = track.querySelectorAll('.review-card');
        if (!slides.length) return;

        var currentIndex = 0;
        var startX = 0;
        var deltaX = 0;

        function updatePosition(index) {
            currentIndex = Math.max(0, Math.min(index, slides.length - 1));
            track.style.transform = 'translateX(' + (-100 * currentIndex) + '%)';
        }

        prevBtn.addEventListener('click', function () {
            updatePosition(currentIndex - 1);
        });

        nextBtn.addEventListener('click', function () {
            updatePosition(currentIndex + 1);
        });

        viewport.addEventListener('touchstart', function (e) {
            startX = e.touches[0].clientX;
            deltaX = 0;
        }, { passive: true });

        viewport.addEventListener('touchmove', function (e) {
            deltaX = e.touches[0].clientX - startX;
        }, { passive: true });

        viewport.addEventListener('touchend', function () {
            var threshold = viewport.offsetWidth * 0.2;
            if (deltaX < -threshold) updatePosition(currentIndex + 1);
            if (deltaX > threshold) updatePosition(currentIndex - 1);
            deltaX = 0;
        });

        updatePosition(0);
    });
})();

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        if (href === '#top') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const target = document.querySelector(href);
        
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: Math.max(0, offsetPosition),
                behavior: 'smooth'
            });
        }
    });
});

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.service-card, .product-card, .gallery-item, .promo-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
});

// Яндекс.Карты: метки салонов (порядок совпадает с карточками и выпадающим списком)
var SALONS_NNOV = [
    { name: 'пр. Гагарина, 184', address: 'Нижний Новгород, проспект Гагарина, 184', lat: 56.23973, lon: 43.96255 },
    { name: 'ул. Бурнаковская, 103А', address: 'Нижний Новгород, Бурнаковская улица, 103А', lat: 56.34228, lon: 43.90640 },
    { name: 'пр. Ленина, 76', address: 'Нижний Новгород, проспект Ленина, 76', lat: 56.26563, lon: 43.91316 },
    { name: 'пр. Ленина, 33', address: 'Нижний Новгород, проспект Ленина, 33', lat: 56.28732, lon: 43.92825 },
    { name: 'ул. Веденяпина, 1А', address: 'Нижний Новгород, улица Веденяпина, 1А', lat: 56.23993, lon: 43.86585 },
    { name: 'ул. Дьяконова, 24А', address: 'Нижний Новгород, улица Дьяконова, 24А', lat: 56.26238, lon: 43.88432 },
    { name: 'пр. Ленина, 113', address: 'Нижний Новгород, проспект Ленина, 113', lat: 56.24981, lon: 43.87637 },
    { name: 'ул. Коминтерна, 117', address: 'Нижний Новгород, улица Коминтерна, 117', lat: 56.35034, lon: 43.86850 },
    { name: 'ул. Бекетова, 66', address: 'Нижний Новгород, улица Бекетова, 66', lat: 56.29435, lon: 44.02106 },
    { name: 'пр. Кораблестроителей, 4', address: 'Нижний Новгород, проспект Кораблестроителей, 4', lat: 56.366421, lon: 43.822442 }
];
var salonsMapInstance = null;

function initYandexSalonsMap(containerId, salons, center, zoom) {
    var container = document.getElementById(containerId);
    if (!container || typeof ymaps === 'undefined' || !salons.length) return null;
    var isMobile = window.innerWidth < 768;
    var map = new ymaps.Map(containerId, {
        center: center,
        zoom: zoom,
        controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
    });
    if (isMobile) {
        map.options.set('minZoom', 10);
    }
    salons.forEach(function (s) {
        var placemark = new ymaps.Placemark([s.lat, s.lon], {
            balloonContentHeader: s.name,
            balloonContentBody: s.address,
            balloonContentFooter: '<a href="https://yandex.ru/maps/?rtext=' + encodeURIComponent(s.address) + '" target="_blank" rel="noopener">Построить маршрут</a>'
        }, { preset: 'islands#orangeDotIconWithCaption', iconCaptionMaxWidth: 120 });
        map.geoObjects.add(placemark);
    });
    if (isMobile) {
        var bounds = map.geoObjects.getBounds();
        if (bounds) {
            map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 80 });
        } else {
            map.setCenter(center, zoom, { duration: 0 });
        }
    } else {
        map.setCenter(center, zoom, { duration: 0 });
    }
    var parent = container.closest('.salons-map');
    if (parent) parent.classList.add('salons-map-api-ready');
    return map;
}

function initYandexMaps() {
    if (typeof ymaps === 'undefined') return;
    ymaps.ready(function () {
        salonsMapInstance = initYandexSalonsMap('salons-map-nnov', SALONS_NNOV, [56.327, 44.006], 11);
    });
}

// Выбор салона по адресу: «Все салоны» — карта целиком, иначе — центр на выбранном салоне
var SALONS_MAP_DEFAULT_LL = [56.327, 44.006];
var SALONS_MAP_DEFAULT_ZOOM = 11;

/** Резервный iframe: метки всех салонов (lat, lon — как в ymaps; в URL Яндекса ll=долгота,широта). */
function buildYandexMapWidgetAllSalonsUrl(lat, lon, zoom) {
    var pts = SALONS_NNOV.map(function (s) {
        return s.lon + ',' + s.lat + ',pm2rdm';
    }).join('~');
    return 'https://yandex.ru/map-widget/v1/?ll=' + lon + '%2C' + lat + '&z=' + zoom + '&pt=' + pts;
}

var salonsIframeDefaultSrc = buildYandexMapWidgetAllSalonsUrl(56.327, 44.006, 12);
var salonsIframeMobileSrc = buildYandexMapWidgetAllSalonsUrl(56.295, 43.945, 10);

var salonsIframeEarly = document.getElementById('salons-iframe-nnov');
if (salonsIframeEarly) {
    salonsIframeEarly.src = window.innerWidth < 768 ? salonsIframeMobileSrc : salonsIframeDefaultSrc;
}

var salonSelectEl = document.getElementById('salon-select-map');
var salonCards = document.querySelectorAll('.salon-card');
var salonsIframe = document.getElementById('salons-iframe-nnov');
if (salonSelectEl && SALONS_NNOV) {
    salonSelectEl.addEventListener('change', function () {
        var val = this.value;
        if (val === 'all' || val === '') {
            if (salonsMapInstance) {
                if (window.innerWidth < 768) {
                    var bounds = salonsMapInstance.geoObjects.getBounds();
                    if (bounds) {
                        salonsMapInstance.setBounds(bounds, { checkZoomRange: true, zoomMargin: 80, duration: 300 });
                    } else {
                        salonsMapInstance.setCenter(SALONS_MAP_DEFAULT_LL, SALONS_MAP_DEFAULT_ZOOM, { duration: 300 });
                    }
                } else {
                    salonsMapInstance.setCenter(SALONS_MAP_DEFAULT_LL, SALONS_MAP_DEFAULT_ZOOM, { duration: 300 });
                }
            } else if (salonsIframe) {
                salonsIframe.src = window.innerWidth < 768 ? salonsIframeMobileSrc : salonsIframeDefaultSrc;
            }
        } else {
            var idx = parseInt(val, 10);
            if (idx >= 0 && idx < SALONS_NNOV.length) {
                var s = SALONS_NNOV[idx];
                if (salonsMapInstance) {
                    salonsMapInstance.setCenter([s.lat, s.lon], 16, { duration: 300 });
                } else if (salonsIframe) {
                    salonsIframe.src = 'https://yandex.ru/map-widget/v1/?ll=' + s.lon + '%2C' + s.lat + '&z=16&pt=' + s.lon + '%2C' + s.lat + ',pm2rdm';
                }
                if (salonCards[idx]) {
                    var card = salonCards[idx];
                    var salonsSection = document.getElementById('salons');
                    if (salonsSection) {
                        salonsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    var listEl = document.querySelector('.salons-list');
                    if (listEl && listEl.scrollHeight > listEl.clientHeight) {
                        var delay = window.innerWidth >= 1024 ? 550 : 350;
                        var scrollList = function () {
                            requestAnimationFrame(function () {
                                requestAnimationFrame(function () {
                                    var listRect = listEl.getBoundingClientRect();
                                    var cardRect = card.getBoundingClientRect();
                                    var cardTopInList = cardRect.top - listRect.top + listEl.scrollTop;
                                    var listH = listEl.clientHeight;
                                    var cardH = card.offsetHeight;
                                    var targetScroll = Math.max(0, cardTopInList - listH / 2 + cardH / 2);
                                    listEl.scrollTo({ top: targetScroll, behavior: 'smooth' });
                                });
                            });
                        };
                        setTimeout(scrollList, delay);
                    }
                }
            }
        }
    });
}

var yandexKey = window.YANDEX_MAPS_API_KEY && window.YANDEX_MAPS_API_KEY !== 'ВАШ_КЛЮЧ_ЯНДЕКС_КАРТ' ? window.YANDEX_MAPS_API_KEY : '';
if (yandexKey) {
    var s = document.createElement('script');
    s.src = 'https://api-maps.yandex.ru/2.1/?apikey=' + yandexKey + '&lang=ru_RU';
    s.async = true;
    s.onload = initYandexMaps;
    s.onerror = function () {
        var fb = document.getElementById('salons-iframe-nnov');
        if (fb) fb.src = salonsIframeDefaultSrc;
    };
    document.head.appendChild(s);
} else {
    var fbNoKey = document.getElementById('salons-iframe-nnov');
    if (fbNoKey) fbNoKey.src = salonsIframeDefaultSrc;
}
