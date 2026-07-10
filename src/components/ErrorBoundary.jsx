import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError() {
    return { hasError: true, message: "画面描画でエラーが発生しました。安全のため詳細情報は表示していません。" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="content">
          <section className="panel">
            <p className="eyebrow">ERROR BOUNDARY</p>
            <h2>KEVIRIO画面でエラーが発生しました</h2>
            <p>安全モードで表示を維持しています。必要ならページを再読み込みしてください。</p>
            <p>{this.state.message}</p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
