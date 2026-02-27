import styles from './SlideViewer.module.css';

export default function SlideViewer({ slides, onBack }) {
    if (!slides || slides.length === 0) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerActions}>
                    <button className={styles.backBtn} onClick={onBack}>
                        ← Back to Generator
                    </button>
                    <button className={styles.exportBtn} onClick={() => window.print()}>
                        📄 Export to PDF
                    </button>
                </div>
                <h2 className={styles.title}>Your Presentation Outline</h2>
            </div>

            <div className={styles.grid}>
                {slides.map((slide, index) => (
                    <div key={index} className={styles.slideCard}>
                        <div className={styles.slideHeader}>
                            <span className={styles.slideNumber}>Slide {index + 1}</span>
                        </div>
                        <h3 className={styles.slideTitle}>{slide.title}</h3>

                        <ul className={styles.bulletPoints}>
                            {slide.bulletPoints.map((point, i) => (
                                <li key={i}>{point}</li>
                            ))}
                        </ul>

                        {slide.audioUrl && (
                            <div className={styles.audioWrapper}>
                                <div className={styles.notesLabel}>🎧 AI Presenter</div>
                                <audio controls src={slide.audioUrl} className={styles.audioPlayer}>
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        )}

                        {slide.speakerNotes && (
                            <div className={styles.speakerNotes}>
                                <div className={styles.notesLabel}>🎤 Speaker Notes</div>
                                <p>{slide.speakerNotes}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
