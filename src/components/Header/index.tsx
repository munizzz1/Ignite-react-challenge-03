import Link from 'next/link';
import styles from './header.module.scss';

export default function Header() {
  return (
    <div className={styles.headerContainer}>
      <Link href="/">
        <a href="">
          <img src="/logo.svg" alt="logo" />
        </a>
      </Link>
    </div>
  )
}