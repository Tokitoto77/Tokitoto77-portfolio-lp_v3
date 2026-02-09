document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // CONFIGURATION
    // ==========================================
    // ここにデプロイしたGASのウェブアプリURLを貼り付けてください
    const GAS_API_URL = "https://script.google.com/macros/s/AKfycbx5Q_3WDaZdDSopZbVwADnkgFHi1kPMGpIdPDWNTic0J_0XmbutzjIgm47x1vTo2rJp/exec";
    // ==========================================

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 96;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Booking Logic
    const timeButtons = document.querySelectorAll('.time-slot-btn');
    const submitBtn = document.getElementById('submit-booking');
    const nameInput = document.getElementById('user-name');
    const emailInput = document.getElementById('user-email');

    let selectedDate = document.querySelector('.date-slot.active')?.dataset.date || "未選択";
    let selectedTime = null;

    // Date Slot Selection (Simple visual toggle only for demo)
    document.querySelectorAll('.date-slot').forEach(slot => {
        slot.addEventListener('click', function () {
            document.querySelectorAll('.date-slot').forEach(s => {
                s.classList.remove('active', 'bg-accent-gold', 'text-navy', 'shadow-lg');
                s.classList.add('hover:bg-navy', 'hover:text-white');
            });
            this.classList.add('active', 'bg-accent-gold', 'text-navy', 'shadow-lg');
            this.classList.remove('hover:bg-navy', 'hover:text-white');
            selectedDate = this.dataset.date;
        });
    });

    // Time Slot Selection
    timeButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            timeButtons.forEach(b => {
                b.classList.remove('border-navy', 'bg-navy/5');
                b.classList.add('bg-white', 'border-navy/10');
            });
            this.classList.remove('bg-white', 'border-navy/10');
            this.classList.add('border-navy', 'bg-navy/5');

            // Extract time text
            selectedTime = this.querySelector('span.font-bold').innerText;
        });
    });

    // Submission Logic
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            // Validation
            if (!selectedTime) {
                alert('時間枠を選択してください。');
                return;
            }
            if (!nameInput.value || !emailInput.value) {
                alert('お名前とメールアドレスを入力してください。');
                return;
            }

            // UI Loading
            const originalText = submitBtn.innerText;
            submitBtn.innerText = '予約処理中...';
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-80', 'cursor-not-allowed');

            const formData = {
                name: nameInput.value,
                email: emailInput.value,
                date: selectedDate,
                time: selectedTime
            };

            // IF NO URL IS SET (Demo Mode)
            if (GAS_API_URL === "YOUR_GAS_WEB_APP_URL_HERE") {
                setTimeout(() => {
                    submitBtn.innerText = '(デモ) 予約完了';
                    submitBtn.classList.replace('bg-navy', 'bg-green-600');
                    alert('【デモモード】\nGASのURLが設定されていません。\nbackendフォルダの手順書に従ってGASをデプロイし、main.jsのGAS_API_URLを書き換えてください。\n\n送信データ:\n' + JSON.stringify(formData, null, 2));

                    // Reset
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalText;
                    submitBtn.classList.replace('bg-green-600', 'bg-navy');
                    submitBtn.classList.remove('opacity-80', 'cursor-not-allowed');
                }, 1000);
                return;
            }

            // Real Fetch Request
            try {
                // cross-origin request to GAS Web App
                const response = await fetch(GAS_API_URL, {
                    method: 'POST',
                    mode: 'no-cors', // Important for GAS opaque response
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                // With no-cors, we can't check response.ok or json()
                // Assume success if no network error
                submitBtn.innerText = '予約完了';
                submitBtn.classList.replace('bg-navy', 'bg-green-600');

                alert('予約を受け付けました。\n確認メールを送信しましたのでご確認ください。');

            } catch (error) {
                console.error('Error:', error);
                alert('送信エラーが発生しました。');
            } finally {
                // Reset UI after delay
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalText;
                    submitBtn.classList.replace('bg-green-600', 'bg-navy');
                    submitBtn.classList.remove('opacity-80', 'cursor-not-allowed');
                    nameInput.value = '';
                    emailInput.value = '';
                }, 3000);
            }
        });
    }

    // FAQ Accordion
    const faqBtns = document.querySelectorAll('.faq-btn');
    faqBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const content = btn.nextElementSibling;
            const icon = btn.querySelector('.material-symbols-outlined');
            if (content) {
                content.classList.toggle('hidden');
                if (content.classList.contains('hidden')) {
                    icon.style.transform = 'rotate(0deg)';
                } else {
                    icon.style.transform = 'rotate(45deg)';
                }
            }
        });
    });
});
