// Цели Яндекс.Метрики (идентификаторы должны совпадать с целями в настройках счётчика)
var METRIKA_ID = 107063229;
function metrikaGoal(id) {
    if (typeof ym === 'function') ym(METRIKA_ID, 'reachGoal', id);
}

// Цель «Записаться» — клик по любой кнопке/ссылке записи
var appointmentModal = document.getElementById('appointmentModal');
function openAppointmentModal() {
    if (!appointmentModal) return;
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

        var phoneInput = document.getElementById('phone');
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
                    metrikaGoal('forma_zapis');
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
    { name: 'пр. Ленина, 76', address: 'Нижний Новгород, проспект Ленина, 76', lat: 56.26563, lon: 43.91316 },
    { name: 'ул. Веденяпина, 1А', address: 'Нижний Новгород, улица Веденяпина, 1А', lat: 56.23993, lon: 43.86585 },
    { name: 'ул. Дьяконова, 24А', address: 'Нижний Новгород, улица Дьяконова, 24А', lat: 56.26238, lon: 43.88432 },
    { name: 'пр. Ленина, 113', address: 'Нижний Новгород, проспект Ленина, 113', lat: 56.24981, lon: 43.87637 },
    { name: 'ул. Коминтерна, 117', address: 'Нижний Новгород, улица Коминтерна, 117', lat: 56.35034, lon: 43.86850 },
    { name: 'ул. Бурнаковская, 103А', address: 'Нижний Новгород, Бурнаковская улица, 103А', lat: 56.34228, lon: 43.90640 },
    { name: 'пр. Ленина, 33', address: 'Нижний Новгород, проспект Ленина, 33', lat: 56.28732, lon: 43.92825 },
    { name: 'пр. Гагарина, 184', address: 'Нижний Новгород, проспект Гагарина, 184', lat: 56.23973, lon: 43.96255 },
    { name: 'ул. Бекетова, 66', address: 'Нижний Новгород, улица Бекетова, 66', lat: 56.29435, lon: 44.02106 },
    { name: 'пр. Кораблестроителей, 4 (скоро открытие)', address: 'Нижний Новгород, проспект Кораблестроителей, 4', lat: 56.366421, lon: 43.822442 }
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
