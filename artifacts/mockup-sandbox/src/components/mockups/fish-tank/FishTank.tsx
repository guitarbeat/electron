import { useState, useCallback } from "react";

const styles = `
.fish-tank-wrapper {
  background: #222;
  display: grid;
  place-items: center;
  height: 100vh;
}

.fish-tank-wrapper #pwrbtn {
  z-index: 100;
  position: absolute;
  bottom: -17px;
  right: 76px;
  background: transparent;
  color: white;
  height: 20px;
  width: 30px;
  border: none;
  cursor: pointer;
}

.fish-tank-wrapper .container {
  position: relative;
  z-index: 1;
  height: 250px;
  width: 400px;
}

.fish-tank-wrapper .container::before {
  content: "";
  background-image: url(https://files.catbox.moe/npo20n.avif);
  height: 46px;
  width: 400px;
  background-size: 100%;
  display: block;
  background-repeat: no-repeat;
  z-index: 99;
  position: absolute;
}

.fish-tank-wrapper .container::after {
  content: "";
  background-image: url(https://files.catbox.moe/9o4qz4.avif);
  height: 94px;
  width: 400px;
  display: block;
  background-repeat: no-repeat;
  z-index: 99;
  position: absolute;
  top: 200px;
}

.fish-tank-wrapper .tank {
  width: 390px;
  height: 240px;
  overflow: hidden;
  position: relative;
  top: 5px;
  left: 5px;
  box-shadow: 0px 0px 10px 0px #a4dfeeab, 0px 0px 10px 0px #a4dfeeab;
}

.fish-tank-wrapper .bg {
  width: 1158px;
  height: 100%;
  position: absolute;
}

.fish-tank-wrapper .far {
  background: url(https://files.catbox.moe/vzglvd.avif) repeat-x, #00bbf3;
  animation: fish-tank-slide 50s linear infinite;
  position: absolute;
  z-index: 0;
}

.fish-tank-wrapper .near {
  background: url(https://files.catbox.moe/len8o6.avif) repeat-x;
  animation: fish-tank-slide 35s linear infinite;
  z-index: 5;
  position: absolute;
}

.fish-tank-wrapper .bgfish {
  background: url(https://files.catbox.moe/05azhb.avif) repeat-x;
  animation: fish-tank-slide 45s linear infinite;
  z-index: 2;
  position: absolute;
}

.fish-tank-wrapper .overlay {
  box-shadow: inset 13px 0px 10px 5px #f4f4f4db,
    inset -13px 0px 10px 5px #f4f4f4db;
  height: 100%;
  position: relative;
  z-index: 10;
  background: #3ad1ff14;
}

.fish-tank-wrapper .fish {
  height: 100%;
  width: 100%;
  position: absolute;
  z-index: 3;
}

.fish-tank-wrapper .clown1 {
  background: url(https://files.catbox.moe/qnfy5o.avif);
  height: 100px;
  width: 100px;
  background-repeat: no-repeat;
  position: absolute;
  top: 20px;
  left: 140px;
  animation: fish-tank-bob2 6s ease-in-out infinite;
}

.fish-tank-wrapper .zebra {
  background: url(https://files.catbox.moe/lina97.avif);
  height: 52px;
  width: 100px;
  background-repeat: no-repeat;
  position: absolute;
  top: 120px;
  left: 30px;
  animation: fish-tank-bob2 2s ease-in-out infinite;
}

.fish-tank-wrapper .butter {
  background: url(https://files.catbox.moe/8qyn7u.avif);
  height: 100px;
  width: 100px;
  background-repeat: no-repeat;
  position: absolute;
  top: 50px;
  left: 250px;
  animation: fish-tank-bob1 5s ease-in-out infinite;
}

@keyframes fish-tank-slide {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-772px, 0, 0);
  }
}

@keyframes fish-tank-bob1 {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(40px);
  }
  100% {
    transform: translateY(0px);
  }
}

@keyframes fish-tank-bob2 {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(10px);
  }
  100% {
    transform: translateY(0px);
  }
}

.fish-tank-wrapper .overlay-off {
  backdrop-filter: brightness(0.5);
}

.fish-tank-wrapper .tank-off {
  box-shadow: inset 0 0 0 0 #000;
}
`;

export default function FishTank() {
  const [isOn, setIsOn] = useState(true);

  const handlePowerClick = useCallback(() => {
    setIsOn((prev) => !prev);
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div className="fish-tank-wrapper">
        <div className="container">
          <div className={`tank${!isOn ? " tank-off" : ""}`}>
            <div
              className="bg far ani"
              style={{ animationPlayState: isOn ? "running" : "paused" }}
            />
            <div
              className="bg bgfish ani"
              style={{ animationPlayState: isOn ? "running" : "paused" }}
            />
            <div className="fish">
              <div
                className="zebra ani"
                style={{ animationPlayState: isOn ? "running" : "paused" }}
              />
              <div
                className="clown1 ani"
                style={{ animationPlayState: isOn ? "running" : "paused" }}
              />
              <div
                className="butter ani"
                style={{ animationPlayState: isOn ? "running" : "paused" }}
              />
            </div>
            <div
              className="bg near ani"
              style={{ animationPlayState: isOn ? "running" : "paused" }}
            />
            <div className={`overlay${!isOn ? " overlay-off" : ""}`} />
          </div>
          <button
            id="pwrbtn"
            data-on={isOn ? "true" : "false"}
            onClick={handlePowerClick}
            aria-label={isOn ? "Turn off fish tank" : "Turn on fish tank"}
          />
        </div>
      </div>
    </>
  );
}
