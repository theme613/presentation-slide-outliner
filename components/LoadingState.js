import styles from './LoadingState.module.css';

export default function LoadingState() {
    return (
        <div className={styles.container}>
            <div className={styles.scannerWrapper}>
                <div className={styles.scannerLine}></div>
                <div className={styles.document}>
                    <div className={styles.line} style={{ width: '60%' }}></div>
                    <div className={styles.line} style={{ width: '85%' }}></div>
                    <div className={styles.line} style={{ width: '40%' }}></div>
                    <div className={styles.line} style={{ width: '75%' }}></div>
                </div>
            </div>
            <h2 className={styles.text}>Organizing your thoughts...</h2>
            <p className={styles.subtext}>Gemini AI is structuring your presentation</p>
        </div>
    );
}
